import type { Metadata } from "next";

import {
  BRAND_APPLE_ICON_PATH,
  BRAND_MARK_PATH,
  BRAND_OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/config/brand";
import { getPublicEnv } from "@/config/env";

export { BRAND_MARK_PATH, BRAND_OG_IMAGE_PATH };

export function getSiteOrigin(): string {
  return getPublicEnv().appUrl;
}

export function absoluteUrl(path: string): string {
  const origin = getSiteOrigin();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getBrandOgImageMetadata() {
  return {
    url: BRAND_OG_IMAGE_PATH,
    width: 1200,
    height: 630,
    alt: SITE_NAME,
  };
}

export function buildDefaultMetadata(): Metadata {
  const metadataBase = new URL(getSiteOrigin());
  const ogImage = getBrandOgImageMetadata();

  return {
    metadataBase,
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    icons: {
      icon: [
        { url: BRAND_MARK_PATH, type: "image/png", sizes: "512x512" },
        { url: "/brand/gasnation-mark-32.png", type: "image/png", sizes: "32x32" },
      ],
      apple: [{ url: BRAND_APPLE_ICON_PATH, type: "image/png", sizes: "180x180" }],
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      images: [BRAND_OG_IMAGE_PATH],
    },
  };
}

export const NO_INDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};
