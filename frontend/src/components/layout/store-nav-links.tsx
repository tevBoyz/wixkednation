"use client";

import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";

import { NavHoverMenu } from "@/components/layout/nav-hover-menu";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useCategories } from "@/hooks/use-categories";
import { sortCategoryTree } from "@/lib/catalog/category-tree";
import { cn } from "@/lib/utils";

/** Grouped site index. Shared by the Index overlay and the colophon footer. */
export const STORE_INDEX_GROUPS = [
  {
    id: "where",
    title: "Where we drive",
    links: [
      { href: "/delivery", label: "All delivery areas" },
      { href: "/delivery/ohio", label: "Ohio" },
      { href: "/delivery/columbus", label: "Columbus" },
      { href: "/delivery/cleveland", label: "Cleveland" },
      { href: "/delivery/cincinnati", label: "Cincinnati" },
    ],
  },
  {
    id: "read",
    title: "Read up",
    links: [
      { href: "/learn", label: "Guides" },
      { href: "/blog", label: "Journal" },
      { href: "/faqs", label: "Questions" },
      { href: "/about", label: "About the house" },
    ],
  },
] as const;

function IndexCategoryLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { data, isLoading, isError } = useCategories();
  const categories = sortCategoryTree(data ?? []);

  if (isLoading) {
    return <li className="py-1.5 text-sm text-muted-foreground">Loading kinds…</li>;
  }

  if (isError) {
    return (
      <li className="py-1.5 text-sm text-destructive">Could not load categories</li>
    );
  }

  return (
    <>
      {categories.map((category) => {
        const children = sortCategoryTree(category.children ?? []);
        return (
          <li key={category.id} className="py-1">
            <Link
              href={`/categories/${category.slug}`}
              onClick={onNavigate}
              className="text-lg text-foreground transition-colors hover:text-primary sm:text-xl"
            >
              {category.name}
            </Link>
            {children.length > 0 ? (
              <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/categories/${child.slug}`}
                      onClick={onNavigate}
                      className="transition-colors hover:text-foreground"
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </>
  );
}

/**
 * The full site index: an "Order" column (menu + live categories)
 * next to delivery and reading groups.
 */
export function StoreNavLinks({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav
      className={cn(
        "grid gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-12",
        className,
      )}
      aria-label="Site index"
    >
      <section aria-labelledby="index-order">
        <h2 id="index-order" className="text-sm font-medium text-muted-foreground">
          Order
        </h2>
        <Link
          href="/products"
          onClick={onNavigate}
          className="mt-4 block text-4xl font-semibold tracking-tight text-foreground transition-colors hover:text-primary sm:text-5xl"
        >
          Full menu <span aria-hidden>→</span>
        </Link>
        <ul className="mt-5 border-t border-white/10 pt-4">
          <IndexCategoryLinks onNavigate={onNavigate} />
          <li className="py-1">
            <Link
              href="/categories"
              onClick={onNavigate}
              className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Every category
            </Link>
          </li>
        </ul>
      </section>

      {STORE_INDEX_GROUPS.map((group) => (
        <section key={group.id} aria-labelledby={`index-${group.id}`}>
          <h2
            id={`index-${group.id}`}
            className="mt-1 text-sm font-medium text-muted-foreground"
          >
            {group.title}
          </h2>
          <ul className="mt-4 space-y-2">
            {group.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className="text-xl text-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}

const menuTriggerClassName =
  "h-9 gap-1.5 rounded-full px-3 text-xs font-medium tracking-normal text-foreground/85 normal-case hover:bg-white/5 data-popup-open:bg-white/10 data-popup-open:text-foreground sm:px-4 sm:text-sm";

function MenuTriggerLabel({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span>{children}</span>
      <ChevronDownIcon className="size-3.5 opacity-70" aria-hidden />
    </>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <DropdownMenuItem render={<Link href={href} className="cursor-pointer" />}>
      {children}
    </DropdownMenuItem>
  );
}

/**
 * Masthead menu bar: three grouped dropdowns (Order / Where we drive / Read up).
 * Opens on hover or click; nothing is shown until opened.
 */
export function SiteMenuBar({ className }: { className?: string }) {
  const { data: categoryData } = useCategories();
  const categories = sortCategoryTree(categoryData ?? []);
  const [whereGroup, readGroup] = STORE_INDEX_GROUPS;

  return (
    <nav
      aria-label="Primary"
      className={cn("flex items-center justify-center gap-1 sm:gap-2", className)}
    >
      <NavHoverMenu
        label={<MenuTriggerLabel>Order</MenuTriggerLabel>}
        triggerClassName={menuTriggerClassName}
        align="center"
        contentClassName="min-w-56"
      >
        <MenuLink href="/products">Full menu</MenuLink>
        {categories.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Categories</DropdownMenuLabel>
              {categories.map((category) => (
                <MenuLink key={category.id} href={`/categories/${category.slug}`}>
                  {category.name}
                </MenuLink>
              ))}
            </DropdownMenuGroup>
          </>
        ) : null}
        <MenuLink href="/categories">All categories</MenuLink>
      </NavHoverMenu>

      <NavHoverMenu
        label={<MenuTriggerLabel>{whereGroup.title}</MenuTriggerLabel>}
        triggerClassName={menuTriggerClassName}
        align="center"
      >
        {whereGroup.links.map((link) => (
          <MenuLink key={link.href} href={link.href}>
            {link.label}
          </MenuLink>
        ))}
      </NavHoverMenu>

      <NavHoverMenu
        label={<MenuTriggerLabel>{readGroup.title}</MenuTriggerLabel>}
        triggerClassName={menuTriggerClassName}
        align="center"
      >
        {readGroup.links.map((link) => (
          <MenuLink key={link.href} href={link.href}>
            {link.label}
          </MenuLink>
        ))}
      </NavHoverMenu>
    </nav>
  );
}
