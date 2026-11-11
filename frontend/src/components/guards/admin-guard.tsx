"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { adminCheck } from "@/lib/api/auth.api";
import {
  buildLoginHref,
  isStaffRole,
} from "@/lib/auth/redirect";

type AdminGuardProps = {
  children: ReactNode;
};

/**
 * Requires authenticated staff (admin or superadmin). Guests → login; others → /forbidden.
 * Verifies with GET /api/auth/admin-check.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(buildLoginHref());
      return;
    }

    if (!isStaffRole(user?.role)) {
      router.replace("/forbidden");
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        await adminCheck();
        if (!cancelled) {
          setVerified(true);
        }
      } catch {
        if (!cancelled) {
          router.replace("/forbidden");
        }
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, pathname, router, user?.role]);

  if (isLoading || (isAuthenticated && isStaffRole(user?.role) && !verified)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Checking admin access…</p>
      </div>
    );
  }

  if (!isAuthenticated || !isStaffRole(user?.role) || !verified) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  return children;
}
