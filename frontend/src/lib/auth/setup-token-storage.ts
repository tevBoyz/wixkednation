const SETUP_TOKEN_KEY = "wixkednation_setup_token";
const SETUP_TOKEN_EXPIRES_KEY = "wixkednation_setup_token_expires";

/** Backend setupToken TTL is 15 minutes; clear a bit early. */
const SETUP_TOKEN_TTL_MS = 14 * 60 * 1000;

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function setSetupToken(token: string): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    sessionStorage.setItem(SETUP_TOKEN_KEY, token);
    sessionStorage.setItem(
      SETUP_TOKEN_EXPIRES_KEY,
      String(Date.now() + SETUP_TOKEN_TTL_MS),
    );
  } catch {
    // ignore quota / private mode
  }
}

export function getSetupToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const token = sessionStorage.getItem(SETUP_TOKEN_KEY);
    const expiresRaw = sessionStorage.getItem(SETUP_TOKEN_EXPIRES_KEY);
    if (!token) {
      return null;
    }

    const expires = expiresRaw ? Number(expiresRaw) : NaN;
    if (!Number.isFinite(expires) || Date.now() > expires) {
      clearSetupToken();
      return null;
    }

    return token;
  } catch {
    return null;
  }
}

export function clearSetupToken(): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    sessionStorage.removeItem(SETUP_TOKEN_KEY);
    sessionStorage.removeItem(SETUP_TOKEN_EXPIRES_KEY);
  } catch {
    // ignore
  }
}
