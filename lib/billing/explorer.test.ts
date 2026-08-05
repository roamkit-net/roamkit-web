import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addressExplorerUrl,
  explorerName,
  txExplorerUrl,
} from "./explorer";

describe("txExplorerUrl", () => {
  it("builds Polygon mainnet tx URLs from chain id", () => {
    const hash =
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    assert.equal(
      txExplorerUrl(137, hash),
      `https://polygonscan.com/tx/${hash}`,
    );
    assert.equal(explorerName(137), "Polygonscan");
  });

  it("builds Amoy testnet tx URLs from chain id", () => {
    const hash =
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    assert.equal(
      txExplorerUrl(80002, hash),
      `https://amoy.polygonscan.com/tx/${hash}`,
    );
  });

  it("normalizes hash without 0x prefix", () => {
    const bare =
      "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
    assert.equal(
      txExplorerUrl(137, bare),
      `https://polygonscan.com/tx/0x${bare}`,
    );
  });

  it("returns null for unknown chain or invalid hash", () => {
    assert.equal(txExplorerUrl(1, "0x" + "aa".repeat(32)), null);
    assert.equal(txExplorerUrl(137, "not-a-hash"), null);
    assert.equal(explorerName(999), null);
  });
});

describe("addressExplorerUrl", () => {
  it("builds address URLs for known chains", () => {
    const addr = "0x0000000000000000000000000000000000000001";
    assert.equal(
      addressExplorerUrl(137, addr),
      `https://polygonscan.com/address/${addr}`,
    );
  });
});
