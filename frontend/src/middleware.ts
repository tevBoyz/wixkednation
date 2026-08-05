import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AGE_GATE_COOKIE } from "@/lib/age-gate/constants";
import { isSearchCrawlerUserAgent } from "@/lib/seo/is-search-crawler";

const PUBLIC_PATHS = ["/age-gate", "/blocked", "/auth/google/callback"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return true;
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
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
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = next.startsWith("/") ? next : "/";
        redirectUrl.search = "";
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
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
