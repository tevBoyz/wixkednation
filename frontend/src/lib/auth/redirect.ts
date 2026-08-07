/**
 * Safe same-origin relative paths for post-login redirects.
 * Rejects protocol-relative and absolute URLs.
 */
export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = "/",
): string {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  return trimmed;
}

/** Always land on the storefront after a successful auth. */
export const POST_AUTH_HOME = "/";

export function buildLoginHref(_returnPath?: string): string {
  return "/login";
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

export function isSuperAdminRole(role: string | null | undefined): boolean {
  return role === "superadmin";
}

/** @deprecated Prefer isStaffRole — includes admin and superadmin. */
export function isAdminRole(role: string | null | undefined): boolean {
  return isStaffRole(role);
}

const AUTH_REDIRECT_KEY = "gasnation_auth_redirect";

/** Clear any persisted post-login path. */
export function clearAuthRedirect(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  } catch {
    // ignore
  }
}

/** @deprecated Prefer clearAuthRedirect - post-auth always goes to storefront. */
export function rememberAuthRedirect(_path?: string | null): void {
  clearAuthRedirect();
}

export function peekAuthRedirect(): string | null {
  return null;
}

/** Clear stored redirect and always return the storefront home. */
export function consumeAuthRedirect(
  _queryRedirect?: string | null,
  _fallback = POST_AUTH_HOME,
): string {
  clearAuthRedirect();
  return POST_AUTH_HOME;
}
