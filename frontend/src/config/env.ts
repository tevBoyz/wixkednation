import { PRODUCTION_SITE_ORIGIN } from "@/config/brand";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isLoopbackOrigin(origin: string): boolean {
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0"
    );
  } catch {
    return false;
  }
}

export type PublicEnv = {
  apiUrl: string;
  appUrl: string;
};

/**
 * Public storefront env.
 * - API URL: always from NEXT_PUBLIC_API_URL in `.env` (no hardcoded fallback).
 * - App URL: NEXT_PUBLIC_APP_URL, else https://gasnationweed.com (never localhost).
 */
export function getPublicEnv(): PublicEnv {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!apiUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_URL. Set it in frontend/.env (see .env.example).",
    );
  }

  const appUrl =
    rawAppUrl && !isLoopbackOrigin(rawAppUrl)
      ? rawAppUrl
      : PRODUCTION_SITE_ORIGIN;

  return {
    apiUrl: trimTrailingSlash(apiUrl),
    appUrl: trimTrailingSlash(appUrl),
  };
}
