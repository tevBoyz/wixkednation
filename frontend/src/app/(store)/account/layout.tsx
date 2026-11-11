import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";

import { AccountNav } from "@/components/account/account-nav";
import { AuthGuard } from "@/components/guards/auth-guard";
import { Container } from "@/components/layout/container";
import { NO_INDEX_METADATA } from "@/lib/seo/site-metadata";

export const metadata: Metadata = NO_INDEX_METADATA;

function GuardFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">Checking session…</p>
    </div>
  );
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<GuardFallback />}>
      <AuthGuard>
        <Container as="main" className="py-10">
          <header className="mb-8">
            <h1>Account</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your profile, addresses, orders, and notifications.
            </p>
          </header>

          <div className="grid gap-8 md:grid-cols-[12rem_minmax(0,1fr)]">
            <aside className="md:sticky md:top-20 md:self-start">
              <AccountNav />
            </aside>
            <div className="min-w-0">{children}</div>
          </div>
        </Container>
      </AuthGuard>
    </Suspense>
  );
}
