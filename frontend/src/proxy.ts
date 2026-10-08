import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AGE_GATE_COOKIE } from "@/lib/age-gate/constants";
import { isSearchCrawlerUserAgent } from "@/lib/seo/is-search-crawler";
import { getSiteOrigin } from "@/lib/seo/site-metadata";

const PUBLIC_PATHS = ["/age-gate", "/blocked", "/auth/google/callback"];

/** Collapse www → apex so Search Console and canonicals stay on one host. */
function redirectWwwToApex(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host");
  if (!host?.startsWith("www.")) {
    return null;
  }
  // Build from configured origin — nextUrl keeps internal :3000 behind nginx.
  const target = new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    getSiteOrigin(),
  );
  return NextResponse.redirect(target, 301);
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return true;
  }

  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return true;
  }

  return false;
}

export function proxy(request: NextRequest) {
  const wwwRedirect = redirectWwwToApex(request);
  if (wwwRedirect) {
    return wwwRedirect;
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dev")) {
    if (process.env.NODE_ENV === "production") {
      const home = request.nextUrl.clone();
      home.pathname = "/";
      home.search = "";
      return NextResponse.redirect(home);
    }
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    if (pathname === "/age-gate" || pathname.startsWith("/age-gate/")) {
      const token = request.cookies.get(AGE_GATE_COOKIE)?.value;
      if (token) {
        const next = request.nextUrl.searchParams.get("next") || "/";
        const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
        const target = new URL(safeNext, request.nextUrl.origin);
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = target.pathname;
        redirectUrl.search = target.search;
        return NextResponse.redirect(redirectUrl);
      }
    }

    return NextResponse.next();
  }

  // Let search engines index storefront pages with full meta + content.
  // Humans without an age-gate cookie still go through /age-gate.
  if (isSearchCrawlerUserAgent(request.headers.get("user-agent"))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AGE_GATE_COOKIE)?.value;

  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/age-gate";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

