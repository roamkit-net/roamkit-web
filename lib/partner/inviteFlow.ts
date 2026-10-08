/** Public invite landing. The query flag is a label, not proof of a visit. */

export const INVITE_REGISTER_PATH = "/register?from=invite";
export const JOIN_COMPLETE_PATH = "/join/complete";
export const PORTAL_PATH = "/me/esims";

export function isInviteRegistration(from: string | null): boolean {
  return from === "invite";
}

/** Where an authenticated or anonymous visitor goes from the register screen. */
export function registerLandingPath(options: {
  fromInvite: boolean;
  authenticated: boolean;
}): string {
  if (!options.authenticated) {
    return options.fromInvite ? INVITE_REGISTER_PATH : "/register";
  }
  if (options.fromInvite) {
    return JOIN_COMPLETE_PATH;
  }
  return PORTAL_PATH;
}

/**
 * Google auth already attributes or consumes when this header is present.
 * The browser therefore stays on one consume path and does not call
 * `/join/complete` again after a successful Google sign-in.
 */
export function googleLandingPath(): string {
  return PORTAL_PATH;
}

export function partnerPendingHeaders(
  pending: string | undefined,
): Record<string, string> {
  if (!pending) {
    return {};
  }
  return { "X-Partner-Pending": pending };
}
