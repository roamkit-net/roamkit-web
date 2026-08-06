"use client";

import Image from "next/image";
import { useState } from "react";

/** Sole allowed reference to the Polygon USDT mark asset. */
export const TOKEN_ICON_SRC = "/icons/usdt-polygon.png";

const SIZE_PX = {
  sm: 14,
  md: 18,
  lg: 24,
  /** Catalog dual-price charge only — do not use as general-purpose size. */
  catalog: 20,
} as const;

export type TokenIconSize = keyof typeof SIZE_PX;

export type TokenIconToken = "USDT";
export type TokenIconNetwork = "polygon";

export type TokenIconProps = {
  /** Fixed size token — no arbitrary px outside this map. */
  size?: TokenIconSize;
  /** Reserved for multi-asset; v1 only USDT. */
  token?: TokenIconToken;
  /** Reserved for multi-network; v1 only polygon. */
  network?: TokenIconNetwork;
  /**
   * When set, the icon is meaningful alone (accessible name).
   * Default: decorative (silent beside visible tokenSymbol text).
   */
  label?: string;
  className?: string;
};

function resolveSrc(
  token: TokenIconToken,
  network: TokenIconNetwork,
): string | null {
  if (token === "USDT" && network === "polygon") {
    return TOKEN_ICON_SRC;
  }
  return null;
}

/**
 * Billing design-system currency mark (Polygon USDT in v1).
 * Callers must not reference the PNG path directly.
 */
export function TokenIcon({
  size = "md",
  token = "USDT",
  network = "polygon",
  label,
  className = "",
}: TokenIconProps) {
  const [failed, setFailed] = useState(false);
  const src = resolveSrc(token, network);
  const px = SIZE_PX[size];

  if (!src || failed) {
    return null;
  }

  const decorative = label == null || label.trim() === "";

  return (
    <Image
      src={src}
      alt={decorative ? "" : label}
      width={px}
      height={px}
      unoptimized
      data-testid="token-icon"
      data-size={size}
      aria-hidden={decorative ? true : undefined}
      onError={() => setFailed(true)}
      className={`inline-block shrink-0 align-middle ${className}`.trim()}
      style={{ width: px, height: px }}
    />
  );
}
