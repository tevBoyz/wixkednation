"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { GasNationLogo } from "@/components/brand/gasnation-logo";
import { CategoriesNav } from "@/components/catalog/categories-nav";
import { StoreNavLinks } from "@/components/layout/store-nav-links";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const linkClassName =
  "block rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
          />
        }
      >
        <MenuIcon className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(100%,20rem)] p-0">
        <SheetHeader className="border-b border-border px-4 py-4 text-left">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div onClick={() => setOpen(false)}>
            <GasNationLogo asLink size="md" />
          </div>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col px-2 py-3">
          <StoreNavLinks
            onNavigate={() => setOpen(false)}
            showInfoLinks={false}
          />
          <div className="mt-3 border-t border-border pt-3">
            <CategoriesNav
              variant="stack"
              onNavigate={() => setOpen(false)}
            />
          </div>
          <div className="mt-4 border-t border-border px-3 pt-4">
            <Link
              href="/login"
              className="block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
          </div>

          <div className="mt-auto border-t border-border px-1 pt-4 pb-2">
            <nav aria-label="Info">
              <ul className="flex flex-col gap-1">
                <li>
                  <Link
                    href="/blog"
                    onClick={() => setOpen(false)}
                    className={linkClassName}
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faqs"
                    onClick={() => setOpen(false)}
                    className={linkClassName}
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    onClick={() => setOpen(false)}
                    className={linkClassName}
                  >
                    About
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
