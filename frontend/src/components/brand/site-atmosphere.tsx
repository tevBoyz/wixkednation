"use client";

import { usePathname } from "next/navigation";

/** Quiet backdrop: near-black with one low green glow. Skipped on admin. */
export function SiteAtmosphere() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/dev")) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(60rem_28rem_at_50%_-6rem,rgba(110,255,60,0.07),transparent_70%)]" />
    </div>
  );
}
