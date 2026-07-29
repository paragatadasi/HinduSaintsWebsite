"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const payload = JSON.stringify({ path: pathname });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/page-views",
        new Blob([payload], { type: "application/json" })
      );
      return;
    }

    void fetch("/api/page-views", {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true
    });
  }, [pathname]);

  return null;
}
