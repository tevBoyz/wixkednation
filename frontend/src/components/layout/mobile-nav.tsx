"use client";

import Link from "next/link";
import { LayoutGridIcon } from "lucide-react";
import { useState } from "react";

import { WixkedNationLogo } from "@/components/brand/wixkednation-logo";
import { OrderContactBanner } from "@/components/layout/order-contact-banner";
import { StoreNavLinks } from "@/components/layout/store-nav-links";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Full-screen site index (all widths). Opened from the floating dock.
 */
export function SiteIndex({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className={triggerClassName}
            aria-label="Open site index"
          />
        }
      >
        <LayoutGridIcon className="size-4" aria-hidden />
        <span>Index</span>
      </SheetTrigger>
      <SheetContent
        side="top"
        className="max-h-dvh gap-0 overflow-y-auto border-0 bg-[#070807] p-0 data-[side=top]:h-dvh data-[side=top]:border-b-0"
      >
        <SheetTitle className="sr-only">Site index</SheetTitle>
        <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-10 px-5 pt-6 pb-28 sm:px-8 sm:pt-8">
          <div className="flex flex-col items-center gap-4 border-b border-white/10 pb-8 text-center">
            <div onClick={close}>
              <WixkedNationLogo
                asLink
                variant="stacked"
                className="w-28 sm:w-36"
              />
            </div>
            <OrderContactBanner placement="line" />
          </div>

          <StoreNavLinks onNavigate={close} />

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-sm">
            <Link
              href="/cart"
              onClick={close}
              className="text-foreground transition-colors hover:text-primary"
            >
              Cart
            </Link>
            <Link
              href="/account"
              onClick={close}
              className="text-foreground transition-colors hover:text-primary"
            >
              Account
            </Link>
            {!isAuthenticated ? (
              <Link
                href="/login"
                onClick={close}
                className={cn("text-foreground transition-colors hover:text-primary")}
              >
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
