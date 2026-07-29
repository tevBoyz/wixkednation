"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { buildLoginHref } from "@/lib/auth/redirect";

type AuthGuardProps = {
  children: ReactNode;
};

/**
 * Requires an authenticated session. Guests are sent to login.
 * After login they always return to the storefront home.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      return;
    }

    router.replace(buildLoginHref());
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Checking session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
      </div>
    );
  }

  return children;
}
