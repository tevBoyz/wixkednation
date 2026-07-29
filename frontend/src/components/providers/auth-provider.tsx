"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { logout as logoutRequest } from "@/lib/api/auth.api";
import { getCurrentUser } from "@/lib/api/users.api";
import type { AuthUser as ApiAuthUser } from "@/lib/api/types";
import {
  onAuthSessionCleared,
} from "@/lib/auth/session";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/lib/auth/token-storage";

export type AuthUser = ApiAuthUser | null;

type AuthContextValue = {
  user: AuthUser;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (payload: {
    user: ApiAuthUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setUser: (user: ApiAuthUser) => void;
  refreshUser: () => Promise<ApiAuthUser>;
  clearSession: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearAuthTokens();
    setUser(null);
  }, []);

  const setSession = useCallback(
    (payload: {
      user: ApiAuthUser;
      accessToken: string;
      refreshToken: string;
    }) => {
      setAuthTokens(payload.accessToken, payload.refreshToken);
      setUser(payload.user);
    },
    [],
  );

  const setUserProfile = useCallback((next: ApiAuthUser) => {
    setUser(next);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await getCurrentUser();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
    } catch {
      // Still clear local session even if network logout fails
    } finally {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    return onAuthSessionCleared(() => {
      setUser(null);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const access = getAccessToken();
      const refresh = getRefreshToken();

      if (!access && !refresh) {
        if (!cancelled) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const me = await getCurrentUser();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          clearSession();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      setSession,
      setUser: setUserProfile,
      refreshUser,
      clearSession,
      logout,
    }),
    [
      user,
      isLoading,
      setSession,
      setUserProfile,
      refreshUser,
      clearSession,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
