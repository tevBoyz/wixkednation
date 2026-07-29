"use client";

import type { ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const navMenuTriggerClassName =
  "inline-flex h-auto items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-muted data-popup-open:text-foreground";

type NavHoverMenuProps = {
  label: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  contentClassName?: string;
  triggerClassName?: string;
  "aria-label"?: string;
};

/**
 * Shared header/nav dropdown: opens on hover (and click/keyboard),
 * non-modal so the pointer can move into the menu.
 */
export function NavHoverMenu({
  label,
  children,
  align = "start",
  contentClassName,
  triggerClassName,
  "aria-label": ariaLabel,
}: NavHoverMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        openOnHover
        delay={75}
        closeDelay={150}
        aria-label={ariaLabel}
        className={cn(navMenuTriggerClassName, triggerClassName)}
      >
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        sideOffset={6}
        className={cn("min-w-48", contentClassName)}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
