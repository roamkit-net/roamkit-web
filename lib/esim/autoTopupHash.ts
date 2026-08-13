/** Stable hash target for Auto top-up on the eSIM detail page. */

export const AUTO_TOPUP_SECTION_ID = "auto-topup";
export const AUTO_TOPUP_HASH = `#${AUTO_TOPUP_SECTION_ID}`;

export function isAutoTopupHash(hash: string): boolean {
  return hash === AUTO_TOPUP_HASH;
}

/** Scroll the wrapper into view and focus it — never a Save/Enable/Turn off control. */
export function focusAutoTopupSection(el: HTMLElement | null): void {
  if (!el) {
    return;
  }
  el.scrollIntoView({ block: "nearest" });
  el.focus({ preventScroll: true });
}
