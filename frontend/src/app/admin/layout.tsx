import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminGuard } from "@/components/guards/admin-guard";
import { NO_INDEX_METADATA } from "@/lib/seo/site-metadata";

export const metadata: Metadata = NO_INDEX_METADATA;

function GuardFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <p className="text-sm text-muted-foreground">Checking admin access…</p>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<GuardFallback />}>
      <AdminGuard>
        <AdminShell>{children}</AdminShell>
      </AdminGuard>
    </Suspense>
  );
}
