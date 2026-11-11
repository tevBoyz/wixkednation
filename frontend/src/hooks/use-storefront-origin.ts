"use client";

import { useEffect, useState } from "react";

import { getPublicEnv, getStorefrontOrigin } from "@/config/env";

/**
 * Full storefront origin for shareable claim links.
 * After mount, prefers the current host when not localhost so the copied
 * URL matches the live hosting domain.
 */
export function useStorefrontOrigin(): string {
  const fallback = getPublicEnv().appUrl;
  const [origin, setOrigin] = useState(fallback);

  useEffect(() => {
    setOrigin(getStorefrontOrigin());
  }, []);

  return origin;
}

export function useClaimUrl(slug: string | null | undefined): string | null {
  const origin = useStorefrontOrigin();
  if (!slug?.trim()) {
    return null;
  }
  const normalized = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!normalized) {
    return null;
  }
  return `${origin}/claim/${normalized}`;
}
