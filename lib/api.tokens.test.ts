import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";

import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  REMEMBER_ME_KEY,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getRememberMePreference,
  setRememberMePreference,
  setTokens,
} from "@/lib/api";

type MemoryStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function createMemoryStorage(
  store: Map<string, string>,
  options?: { throwOnWrite?: boolean; throwOnRead?: boolean },
): MemoryStorage {
  return {
    getItem(key: string) {
      if (options?.throwOnRead) {
        throw new DOMException("Denied", "SecurityError");
      }
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      if (options?.throwOnWrite) {
        throw new DOMException("Denied", "SecurityError");
      }
      store.set(key, value);
    },
    removeItem(key: string) {
      if (options?.throwOnWrite) {
        throw new DOMException("Denied", "SecurityError");
      }
      store.delete(key);
    },
  };
}

describe("api token storage (remember me)", () => {
  const sessionStore = new Map<string, string>();
  const localStore = new Map<string, string>();

  before(() => {
    Object.defineProperty(globalThis, "window", {
      value: globalThis,
      configurable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: createMemoryStorage(sessionStore),
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: createMemoryStorage(localStore),
      configurable: true,
    });
  });

  afterEach(() => {
    sessionStore.clear();
    localStore.clear();
    clearTokens();
    Object.defineProperty(globalThis, "sessionStorage", {
      value: createMemoryStorage(sessionStore),
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: createMemoryStorage(localStore),
      configurable: true,
    });
  });

  it("defaults remember-me preference to true when missing", () => {
    assert.equal(getRememberMePreference(), true);
  });

  it("persists remember-me preference in localStorage", () => {
    setRememberMePreference(false);
    assert.equal(localStore.get(REMEMBER_ME_KEY), "false");
    assert.equal(getRememberMePreference(), false);
    setRememberMePreference(true);
    assert.equal(localStore.get(REMEMBER_ME_KEY), "true");
    assert.equal(getRememberMePreference(), true);
  });

  it("stores tokens in localStorage when rememberMe is true", () => {
    setTokens("access-local", "refresh-local", true);
    assert.equal(localStore.get(ACCESS_TOKEN_KEY), "access-local");
    assert.equal(localStore.get(REFRESH_TOKEN_KEY), "refresh-local");
    assert.equal(sessionStore.has(ACCESS_TOKEN_KEY), false);
    assert.equal(getAccessToken(), "access-local");
    assert.equal(getRefreshToken(), "refresh-local");
  });

  it("stores tokens in sessionStorage when rememberMe is false", () => {
    setTokens("access-session", "refresh-session", false);
    assert.equal(sessionStore.get(ACCESS_TOKEN_KEY), "access-session");
    assert.equal(sessionStore.get(REFRESH_TOKEN_KEY), "refresh-session");
    assert.equal(localStore.has(ACCESS_TOKEN_KEY), false);
    assert.equal(getAccessToken(), "access-session");
    assert.equal(getRefreshToken(), "refresh-session");
  });

  it("clears the other store when switching rememberMe", () => {
    setTokens("a1", "r1", true);
    setTokens("a2", "r2", false);
    assert.equal(localStore.has(ACCESS_TOKEN_KEY), false);
    assert.equal(sessionStore.get(ACCESS_TOKEN_KEY), "a2");
    setTokens("a3", "r3", true);
    assert.equal(sessionStore.has(ACCESS_TOKEN_KEY), false);
    assert.equal(localStore.get(ACCESS_TOKEN_KEY), "a3");
  });

  it("silent refresh keeps sessionStorage tokens in sessionStorage", () => {
    setTokens("access-old", "refresh-same", false);
    setTokens("access-new", "refresh-same");
    assert.equal(sessionStore.get(ACCESS_TOKEN_KEY), "access-new");
    assert.equal(sessionStore.get(REFRESH_TOKEN_KEY), "refresh-same");
    assert.equal(localStore.has(ACCESS_TOKEN_KEY), false);
  });

  it("silent refresh keeps localStorage tokens in localStorage", () => {
    setTokens("access-old", "refresh-same", true);
    setTokens("access-new", "refresh-same");
    assert.equal(localStore.get(ACCESS_TOKEN_KEY), "access-new");
    assert.equal(sessionStore.has(ACCESS_TOKEN_KEY), false);
  });

  it("prefers localStorage and clears session when both contain tokens", () => {
    localStore.set(ACCESS_TOKEN_KEY, "local-access");
    localStore.set(REFRESH_TOKEN_KEY, "local-refresh");
    sessionStore.set(ACCESS_TOKEN_KEY, "session-access");
    sessionStore.set(REFRESH_TOKEN_KEY, "session-refresh");

    assert.equal(getAccessToken(), "local-access");
    assert.equal(getRefreshToken(), "local-refresh");
    assert.equal(sessionStore.has(ACCESS_TOKEN_KEY), false);
    assert.equal(sessionStore.has(REFRESH_TOKEN_KEY), false);
  });

  it("clearTokens removes tokens from both storages but keeps preference", () => {
    setRememberMePreference(false);
    setTokens("a", "r", false);
    localStore.set(ACCESS_TOKEN_KEY, "stale-local");
    localStore.set(REFRESH_TOKEN_KEY, "stale-local-r");

    clearTokens();

    assert.equal(localStore.has(ACCESS_TOKEN_KEY), false);
    assert.equal(localStore.has(REFRESH_TOKEN_KEY), false);
    assert.equal(sessionStore.has(ACCESS_TOKEN_KEY), false);
    assert.equal(sessionStore.has(REFRESH_TOKEN_KEY), false);
    assert.equal(getAccessToken(), null);
    assert.equal(getRefreshToken(), null);
    assert.equal(getRememberMePreference(), false);
  });

  it("treats empty token strings as missing", () => {
    localStore.set(ACCESS_TOKEN_KEY, "");
    localStore.set(REFRESH_TOKEN_KEY, "");
    assert.equal(getAccessToken(), null);
    setTokens("ok-a", "ok-r", false);
    assert.equal(getAccessToken(), "ok-a");
  });

  it("falls back to in-memory when web storage throws", () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: createMemoryStorage(localStore, { throwOnWrite: true }),
      configurable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: createMemoryStorage(sessionStore, { throwOnWrite: true }),
      configurable: true,
    });

    setTokens("mem-access", "mem-refresh", true);
    assert.equal(getAccessToken(), "mem-access");
    assert.equal(getRefreshToken(), "mem-refresh");

    setTokens("mem-access-2", "mem-refresh-2");
    assert.equal(getAccessToken(), "mem-access-2");
    assert.equal(getRefreshToken(), "mem-refresh-2");

    clearTokens();
    assert.equal(getAccessToken(), null);
  });
});
