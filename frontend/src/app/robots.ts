import type { MetadataRoute } from "next";

import { getSiteOrigin } from "@/lib/seo/site-metadata";

const DISALLOW_PATHS = [
  "/admin",
  "/account",
  "/login",
  "/register",
  "/forgot-pin",
  "/setup-pin",
  "/verify-otp",
  "/checkout",
  "/cart",
  "/auth",
  "/age-gate",
  "/blocked",
  "/forbidden",
  "/order-success",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: DISALLOW_PATHS,
    },
    sitemap: `${getSiteOrigin()}/sitemap.xml`,
  };
}
