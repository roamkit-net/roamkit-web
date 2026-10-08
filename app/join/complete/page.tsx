"use client";

import { useEffect, useState } from "react";

import { getAccessToken } from "@/lib/api";
import { loginHref } from "@/lib/navigation/safePath";

export default function JoinCompletePage() {
  const [message, setMessage] = useState("Checking your invite…");

  useEffect(() => {
    const access = getAccessToken();
    if (!access) {
      window.location.assign(loginHref("/join/complete"));
      return;
    }
    let cancelled = false;
    fetch("/join/complete/consume", {
      method: "POST",
      headers: { Authorization: `Bearer ${access}`, Accept: "application/json" },
      cache: "no-store",
    })
      .then(async (response) => {
        if (cancelled) {
          return;
        }
        if (response.status === 401) {
          setMessage("Sign in again to finish joining.");
          return;
        }
        if (!response.ok) {
          setMessage("The invite could not be applied. Retry this page.");
          return;
        }
        window.location.assign("/me/esims");
      })
      .catch(() => {
        if (!cancelled) {
          setMessage("The invite could not be applied. Retry this page.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <p className="p-6 text-sm">{message}</p>;
}
