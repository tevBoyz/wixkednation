const ASSET_PATH_PREFIX = "/api/assets/";

function getApiBaseUrl(): string | null {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  return apiUrl || null;
}

/**
 * Point asset URLs at the API this frontend is configured to talk to.
 *
 * The API builds absolute image URLs from its own BACKEND_URL, so a backend
 * deployed behind a different hostname than it thinks it has (or a cart line
 * persisted while pointing at another environment) yields unreachable hosts.
 * Rebasing keeps rendering tied to NEXT_PUBLIC_API_URL; non-asset sources such
 * as Supabase public storage are left untouched.
 */
export function resolveCatalogAssetUrl(
  src: string | null | undefined,
): string | null {
  const trimmed = src?.trim();
  if (!trimmed) {
    return null;
  }

  const apiUrl = getApiBaseUrl();
  if (!apiUrl) {
    return trimmed;
  }

  if (trimmed.startsWith(ASSET_PATH_PREFIX)) {
    return `${apiUrl}${trimmed}`;
  }

  if (trimmed.startsWith(`${apiUrl}${ASSET_PATH_PREFIX}`)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (!url.pathname.startsWith(ASSET_PATH_PREFIX)) {
      return trimmed;
    }

    return `${apiUrl}${url.pathname}${url.search}`;
  } catch {
    return trimmed;
  }
}

/** True when hostname is loopback / private (Next image optimizer blocks these). */
function isPrivateOrLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0.0.0.0"
  ) {
    return true;
  }

  // IPv4 private ranges
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;

  return false;
}

/** Hostnames allowed for next/image optimization of catalog assets. */
export function canOptimizeCatalogImage(src: string | null | undefined): boolean {
  const trimmed = src?.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const url = new URL(trimmed);

    // Next.js blocks optimizing upstream images on private IPs (SSRF guard).
    // Fall back to a plain <img> so localhost API assets still render in dev.
    if (isPrivateOrLocalHostname(url.hostname)) {
      return false;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (apiUrl) {
      const apiHost = new URL(apiUrl).hostname;
      if (url.hostname === apiHost) {
        return true;
      }
    }

    return url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export function getCatalogImageSizes(variant: "card" | "detail" | "thumb" = "card"): string {
  switch (variant) {
    case "detail":
      return "(max-width: 768px) 100vw, 50vw";
    case "thumb":
      return "64px";
    default:
      return "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px";
  }
}
