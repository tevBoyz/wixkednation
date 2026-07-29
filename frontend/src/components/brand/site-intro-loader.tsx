"use client";

import { useEffect, useState } from "react";

import { GasNationLoader } from "@/components/brand/gasnation-loader";

const INTRO_KEY = "gasnation_intro_seen";
const INTRO_MS = 3000;

function shouldPlayIntro(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  let isReload = false;
  try {
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;
    isReload = nav?.type === "reload";
  } catch {
    isReload = false;
  }

  let firstVisit = true;
  try {
    firstVisit = !sessionStorage.getItem(INTRO_KEY);
    if (firstVisit) {
      sessionStorage.setItem(INTRO_KEY, "1");
    }
  } catch {
    firstVisit = true;
  }

  return firstVisit || isReload;
}

/**
 * Brand splash on first storefront visit in a session, and on every hard reload.
 */
export function SiteIntroLoader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!shouldPlayIntro()) {
      return;
    }

    let cancelled = false;
    setVisible(true);

    const hideTimer = window.setTimeout(() => {
      if (!cancelled) {
        setVisible(false);
      }
    }, INTRO_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return <GasNationLoader />;
}
