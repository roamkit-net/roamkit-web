"use client";

import { useCallback, useRef } from "react";

export function usePartnerChannelGuard(channelId: string) {
  const current = useRef(channelId);
  current.current = channelId;
  const isCurrent = useCallback(
    (selected: string) => current.current === selected,
    [],
  );
  return { isCurrent };
}
