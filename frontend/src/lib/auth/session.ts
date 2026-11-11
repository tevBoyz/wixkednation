import { getPublicEnv } from "@/config/env";
import {
  clearAuthTokens,
  getRefreshToken,
  setAuthTokens,
} from "@/lib/auth/token-storage";

type SessionClearedListener = () => void;

const listeners = new Set<SessionClearedListener>();

export function onAuthSessionCleared(listener: SessionClearedListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyAuthSessionCleared(): void {
  for (const listener of listeners) {
    listener();
  }
}

let refreshPromise: Promise<boolean> | null = null;

/**
 * Single-flight access-token refresh.
 * Returns true when new tokens were stored.
 */
export async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthTokens();
      notifyAuthSessionCleared();
      return false;
    }

    try {
      const { apiUrl } = getPublicEnv();
      const response = await fetch(`${apiUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });

      if (!response.ok) {
        clearAuthTokens();
        notifyAuthSessionCleared();
        return false;
      }

      const json = (await response.json()) as {
        data?: { accessToken?: string; refreshToken?: string };
      };

      const accessToken = json.data?.accessToken;
      const nextRefresh = json.data?.refreshToken;

      if (!accessToken || !nextRefresh) {
        clearAuthTokens();
        notifyAuthSessionCleared();
        return false;
      }

      setAuthTokens(accessToken, nextRefresh);
      return true;
    } catch {
      clearAuthTokens();
      notifyAuthSessionCleared();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
