"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const CURRENT_KEY = "wixkednation_nav_current";
const PREVIOUS_KEY = "wixkednation_nav_previous";

export function getPreviousAppPath(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return sessionStorage.getItem(PREVIOUS_KEY);
  } catch {
    return null;
  }
}

function recordPath(next: string) {
  try {
    const current = sessionStorage.getItem(CURRENT_KEY);
    if (current && current !== next) {
      sessionStorage.setItem(PREVIOUS_KEY, current);
    }
    sessionStorage.setItem(CURRENT_KEY, next);
  } catch {
    // ignore private mode / quota
  }
}

function NavigationTrailInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const next = search ? `${pathname}?${search}` : pathname;

  // Record during render so product detail can read the previous path immediately.
  if (typeof window !== "undefined") {
    recordPath(next);
  }

  return null;
}

/** Records last in-app path so product detail can return accurately. */
export function NavigationTrail() {
  return (
    <Suspense fallback={null}>
      <NavigationTrailInner />
    </Suspense>
  );
}
