import { apiRequest } from "@/lib/api/client";
import { getSessionId, getVisitorId } from "@/lib/analytics/ids";

type TrackPayload = {
  path: string;
};

function readUtms(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landingPath?: string;
} {
  if (typeof window === "undefined") {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source") || undefined;
  const utmMedium = params.get("utm_medium") || undefined;
  const utmCampaign = params.get("utm_campaign") || undefined;

  return {
    utmSource,
    utmMedium,
    utmCampaign,
    landingPath: window.location.pathname.slice(0, 500),
  };
}

/** Fire-and-forget pageview; never throws to callers. */
export async function trackPageView({ path }: TrackPayload): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (!path || path === "/admin" || path.startsWith("/admin/")) {
    return;
  }

  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const utms = readUtms();

    await apiRequest("/api/analytics/collect", {
      method: "POST",
      auth: false,
      body: {
        visitorId,
        sessionId,
        path,
        referrer: document.referrer || undefined,
        landingPath: utms.landingPath || path,
        utmSource: utms.utmSource,
        utmMedium: utms.utmMedium,
        utmCampaign: utms.utmCampaign,
      },
      timeoutMs: 8000,
    });
  } catch {
    // Analytics must never break the storefront.
  }
}
