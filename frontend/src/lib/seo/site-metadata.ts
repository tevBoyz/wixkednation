import type { Metadata } from "next";

import {
  BRAND_APPLE_ICON_PATH,
  BRAND_MARK_PATH,
  BRAND_OG_IMAGE_PATH,
  SITE_DEFAULT_TITLE,
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
    url: absoluteUrl(BRAND_OG_IMAGE_PATH),
    width: 1200,
    height: 630,
    alt: SITE_NAME,
  };
}

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path?: string;
  /** When true (default), title is used as-is without the root `%s | Brand` template. */
  absoluteTitle?: boolean;
}): Metadata {
  const ogImage = getBrandOgImageMetadata();
  const canonical = input.path ? absoluteUrl(input.path) : undefined;
  const useAbsolute = input.absoluteTitle !== false;
  const fullTitle = useAbsolute
    ? input.title
    : `${input.title} | ${SITE_NAME}`;

  return {
    title: useAbsolute ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      title: fullTitle,
      description: input.description,
      url: canonical,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: input.description,
      images: [absoluteUrl(BRAND_OG_IMAGE_PATH)],
    },
  };
}

export function buildDefaultMetadata(): Metadata {
  const metadataBase = new URL(getSiteOrigin());
  const ogImage = getBrandOgImageMetadata();

  return {
    metadataBase,
    title: {
      default: SITE_DEFAULT_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    alternates: {
      canonical: absoluteUrl("/"),
    },
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
      title: SITE_DEFAULT_TITLE,
      description: SITE_DESCRIPTION,
      url: absoluteUrl("/"),
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_DEFAULT_TITLE,
      description: SITE_DESCRIPTION,
      images: [absoluteUrl(BRAND_OG_IMAGE_PATH)],
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
