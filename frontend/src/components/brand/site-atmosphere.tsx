"use client";

import { usePathname } from "next/navigation";

import { FloatingArtifacts } from "@/components/brand/floating-artifacts";

/** Site-wide botanical atmosphere; skipped on admin. */
export function SiteAtmosphere() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/dev")) {
    return null;
  }

  return <FloatingArtifacts className="fixed inset-0 z-0" />;
}
