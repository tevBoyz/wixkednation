"use client";

import { ShoppingCartIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ProductSearchDialog } from "@/components/catalog/product-search-dialog";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationsNavButton } from "@/components/notifications/notifications-nav-button";
import { NavHoverMenu } from "@/components/layout/nav-hover-menu";
import { StoreNavLinks } from "@/components/layout/store-nav-links";
import { Container } from "@/components/layout/container";
import { GasNationLogo } from "@/components/brand/gasnation-logo";
import { useAuth } from "@/components/providers/auth-provider";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { isStaffRole } from "@/lib/auth/redirect";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { itemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  async function onLogout() {
    await logout();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  return (
    <header className="w-full min-w-0 overflow-visible border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <Container className="relative flex h-[4.25rem] min-w-0 items-center gap-1.5 overflow-visible sm:h-[4.75rem] sm:gap-2">
        <div className="relative z-10 shrink-0">
          <MobileNav />
        </div>

        {/* Mark only in nav - brand name lives on the home hero */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 z-0 flex items-center justify-center md:static md:pointer-events-auto md:inset-auto md:z-auto md:justify-start">
          <div className="pointer-events-auto overflow-visible p-1">
            <GasNationLogo
              asLink
              variant="mark"
              size="lg"
              priority
              markClassName="size-12 sm:size-14"
            />
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 items-center md:flex">
          <StoreNavLinks className="ml-2" showCategoriesDropdown />
        </div>

        <div className="relative z-10 ml-auto flex shrink-0 items-center gap-0">
          <ProductSearchDialog />

          <Button
            render={<Link href="/cart" />}
            nativeButton={false}
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
          >
            <ShoppingCartIcon className="size-4" />
            {itemCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            ) : null}
          </Button>

          {isAuthenticated ? <NotificationsNavButton /> : null}

          <NavHoverMenu
            align="end"
            aria-label="Account menu"
            triggerClassName="size-8 shrink-0 justify-center gap-0 px-0 py-0"
            label={<UserIcon className="size-4" />}
          >
            {isAuthenticated ? (
              <>
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  {user?.phone || user?.email || user?.name || "Signed in"}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={<Link href="/account" className="cursor-pointer" />}
                >
                  Account
                </DropdownMenuItem>
                {isStaffRole(user?.role) ? (
                  <DropdownMenuItem
                    render={<Link href="/admin" className="cursor-pointer" />}
                  >
                    Admin dashboard
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={() => void onLogout()}>
                  Log out
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  render={<Link href="/login" className="cursor-pointer" />}
                >
                  Sign in
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/account" className="cursor-pointer" />}
                >
                  Account
                </DropdownMenuItem>
              </>
            )}
          </NavHoverMenu>
        </div>
      </Container>
    </header>
  );
}
