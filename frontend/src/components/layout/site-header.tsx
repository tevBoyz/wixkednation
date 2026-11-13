"use client";

import { ShoppingBagIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ProductSearchDialog } from "@/components/catalog/product-search-dialog";
import { OrderContactBanner } from "@/components/layout/order-contact-banner";
import { SiteIndex } from "@/components/layout/mobile-nav";
import { SiteMenuBar } from "@/components/layout/store-nav-links";
import { NotificationsNavButton } from "@/components/notifications/notifications-nav-button";
import { NavHoverMenu } from "@/components/layout/nav-hover-menu";
import { Container } from "@/components/layout/container";
import { WixkedNationLogo } from "@/components/brand/wixkednation-logo";
import { useAuth } from "@/components/providers/auth-provider";
import { useCart } from "@/components/providers/cart-provider";
import { isStaffRole } from "@/lib/auth/redirect";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Masthead: the official lockup centered, desk hours/phones on the left,
 * order terms on the right; grouped dropdown menus underneath.
 */
export function SiteHeader() {
  return (
    <header className="relative z-30 border-b border-white/10">
      <Container className="grid items-center gap-2 py-2.5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-4 lg:py-3">
        <OrderContactBanner placement="masthead" className="hidden lg:block" />

        <div className="flex justify-center">
          <WixkedNationLogo
            asLink
            variant="stacked"
            size="lg"
            priority
            className="w-18 sm:w-20 lg:w-26"
          />
        </div>

        <div className="hidden text-right lg:block">
          <p className="text-xs leading-4 font-medium text-foreground xl:text-sm">
            Same-day delivery across Ohio
          </p>
          <p className="text-xs leading-4 text-muted-foreground xl:text-sm">
            21+ with valid ID · cash at the door
          </p>
        </div>

        <OrderContactBanner placement="line" className="lg:hidden" />
      </Container>
      <div className="border-t border-white/10">
        <Container className="py-1">
          <SiteMenuBar />
        </Container>
      </div>
    </header>
  );
}

const dockItemClassName =
  "relative inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-3 text-xs font-medium text-foreground transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4 sm:text-sm";

/**
 * Floating control dock (all widths): Index, Search, Cart, Account,
 * and notifications when signed in.
 */
export function StoreDock() {
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
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 sm:bottom-5">
      <div
        role="toolbar"
        aria-label="Store controls"
        className="wn-dock pointer-events-auto flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full p-1.5"
      >
        <SiteIndex
          triggerClassName={cn(
            dockItemClassName,
            "wn-neon-fill px-4 font-semibold hover:bg-transparent sm:px-5",
          )}
        />

        <ProductSearchDialog triggerClassName={dockItemClassName} label="Search" />

        <Link
          href="/cart"
          className={dockItemClassName}
          aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
        >
          <ShoppingBagIcon className="size-4" aria-hidden />
          <span>Cart</span>
          {itemCount > 0 ? (
            <span className="wn-neon-fill inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
              {itemCount > 9 ? "9+" : itemCount}
            </span>
          ) : null}
        </Link>

        <NavHoverMenu
          align="end"
          aria-label="Account menu"
          triggerClassName={cn(
            dockItemClassName,
            "tracking-normal normal-case data-popup-open:bg-white/10 data-popup-open:text-foreground",
          )}
          label={
            <>
              <UserIcon className="size-4" aria-hidden />
              <span className="hidden sm:inline">
                {isAuthenticated ? "Account" : "Sign in"}
              </span>
            </>
          }
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

        {isAuthenticated ? <NotificationsNavButton /> : null}
      </div>
    </div>
  );
}
