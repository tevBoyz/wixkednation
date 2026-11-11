"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { trackPageView } from "@/lib/analytics/track";

/** Records storefront pageviews; ignore admin. */
export function AnalyticsBeacon() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) {
      return;
    }
    lastPath.current = pathname;
    void trackPageView({ path: pathname });
  }, [pathname]);

  return null;
}
