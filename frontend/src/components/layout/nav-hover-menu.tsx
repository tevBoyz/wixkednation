"use client";

import type { ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const navMenuTriggerClassName =
  "inline-flex h-auto items-center gap-1 px-3 py-2 text-[0.7rem] font-medium tracking-[0.18em] text-foreground/80 uppercase transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-popup-open:text-primary";

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
