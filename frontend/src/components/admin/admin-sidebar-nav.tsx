"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  ADMIN_NAV_ITEMS,
  isAdminNavActive,
} from "@/components/admin/admin-nav";
import { cn } from "@/lib/utils";

type AdminSidebarNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function AdminSidebarNav({
  onNavigate,
  className,
}: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1", className)} aria-label="Admin">
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = isAdminNavActive(pathname, item);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
