const MESSAGES: Record<string, string> = {
  authentication_required: "Sign in to open the partner portal.",
  partner_channel_disabled: "The partner portal is turned off.",
  partner_access_denied: "This partner channel is not available.",
  partner_grant_forbidden: "This role cannot give credit.",
  partner_invite_forbidden: "This role cannot change the invite link.",
  customer_not_found: "That customer is not on this channel.",
  customer_attribution_changed: "That customer is no longer on this channel.",
  insufficient_funds: "The available balance is not enough for this grant.",
  idempotency_key_conflict: "This grant was already submitted with different details.",
  partner_grant_same_account: "This grant cannot move credit to the same account.",
  partner_settlement_account_missing:
    "Partner billing is unavailable. Nothing was changed.",
  rate_limited: "Too many partner changes. Wait and try again.",
  partner_self_referral: "This person cannot be a customer of their own channel.",
};

export function partnerErrorMessage(code: string): string {
  return MESSAGES[code] ?? "The partner request failed.";
}
