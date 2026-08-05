"use client";

import Link from "next/link";

import { CategoriesNav } from "@/components/catalog/categories-nav";

const linkClassName =
  "block rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function StoreNavLinks({
  className,
  onNavigate,
  showCategoriesDropdown = false,
  showInfoLinks = true,
}: {
  className?: string;
  onNavigate?: () => void;
  /** Desktop: Categories hover-dropdown after Products */
  showCategoriesDropdown?: boolean;
  /** FAQ + About links (hide on mobile primary list; render separately at bottom) */
  showInfoLinks?: boolean;
}) {
  return (
    <nav className={className} aria-label="Primary">
      <ul className="flex flex-col gap-1 md:flex-row md:items-center md:gap-1">
        <li>
          <Link href="/products" onClick={onNavigate} className={linkClassName}>
            Products
          </Link>
        </li>
        {showCategoriesDropdown ? (
          <li className="hidden md:list-item">
            <CategoriesNav variant="dropdown" />
          </li>
        ) : null}
        {showInfoLinks ? (
          <>
            <li>
              <Link href="/delivery" onClick={onNavigate} className={linkClassName}>
                Delivery
              </Link>
            </li>
            <li>
              <Link href="/faqs" onClick={onNavigate} className={linkClassName}>
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/about" onClick={onNavigate} className={linkClassName}>
                About
              </Link>
            </li>
          </>
        ) : null}
      </ul>
    </nav>
  );
}
