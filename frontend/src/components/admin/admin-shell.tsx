"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { adminTitleFromPath } from "@/components/admin/admin-nav";
import { GasNationLogo } from "@/components/brand/gasnation-logo";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = adminTitleFromPath(pathname);

  async function onLogout() {
    await logout();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="Open admin menu"
              />
            }
          >
            <MenuIcon className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(100%,18rem)] p-0">
            <SheetHeader className="border-b border-border px-4 py-4 text-left">
              <SheetTitle>Admin menu</SheetTitle>
            </SheetHeader>
            <div className="p-3">
              <AdminSidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">Admin</p>
          <h1 className="truncate text-base font-semibold capitalize">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            render={<Link href="/" />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Storefront
          </Button>
          <span className="hidden max-w-[10rem] truncate text-xs text-muted-foreground md:inline">
            {user?.phone || user?.email || user?.name || "Admin"}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={() => void onLogout()}>
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}

export function AdminSidebar() {
  return (
    <aside className="hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-muted/20 lg:flex">
      <div className="shrink-0 border-b border-border px-4 py-4">
        <GasNationLogo asLink size="sm" />
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          Admin console
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <AdminSidebarNav />
      </div>
      <div className="shrink-0 border-t border-border p-3">
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Back to storefront
        </Button>
      </div>
    </aside>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
