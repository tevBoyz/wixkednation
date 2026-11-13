"use client";

import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

import { useCategories } from "@/hooks/use-categories";
import { NavHoverMenu } from "@/components/layout/nav-hover-menu";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { sortCategoryTree } from "@/lib/catalog/category-tree";
import type { Category } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type CategoriesNavProps = {
  className?: string;
  onNavigate?: () => void;
  /** Desktop dropdown vs mobile sheet list */
  variant?: "dropdown" | "stack";
};

function useAccordionIds() {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  function toggle(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return { openIds, toggle };
}

function StackCategoryBranch({
  category,
  onNavigate,
  depth = 0,
  openIds,
  onToggle,
}: {
  category: Category;
  onNavigate?: () => void;
  depth?: number;
  openIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const panelId = useId();
  const children = sortCategoryTree(category.children ?? []);
  const hasChildren = children.length > 0;
  const isOpen = openIds.has(category.id);

  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-0.5",
          depth === 0 ? "px-1" : "px-1 pl-3",
        )}
      >
        <Link
          href={`/categories/${category.slug}`}
          onClick={onNavigate}
          className={cn(
            "min-w-0 flex-1 rounded-md px-2 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            depth > 0 && "text-muted-foreground",
          )}
        >
          {category.name}
        </Link>
        {hasChildren ? (
          <button
            type="button"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={isOpen}
            aria-controls={panelId}
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${category.name}`}
            onClick={() => onToggle(category.id)}
          >
            <ChevronDownIcon
              className={cn(
                "size-4 transition-transform duration-200 ease-out",
                isOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        ) : null}
      </div>

      {hasChildren ? (
        <div
          id={panelId}
          role="region"
          aria-label={`${category.name} subcategories`}
          aria-hidden={!isOpen}
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <ul className="overflow-hidden">
            {children.map((child) => (
              <StackCategoryBranch
                key={child.id}
                category={child}
                onNavigate={onNavigate}
                depth={depth + 1}
                openIds={openIds}
                onToggle={onToggle}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

function DropdownCategoryBranch({
  category,
  depth = 0,
  openIds,
  onToggle,
}: {
  category: Category;
  depth?: number;
  openIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const panelId = useId();
  const children = sortCategoryTree(category.children ?? []);
  const hasChildren = children.length > 0;
  const isOpen = openIds.has(category.id);
  const padClass =
    depth === 0 ? "" : depth === 1 ? "pl-4" : "pl-8";

  if (!hasChildren) {
    return (
      <DropdownMenuItem
        render={
          <Link
            href={`/categories/${category.slug}`}
            className={cn(
              "cursor-pointer",
              padClass,
              depth > 0 && "text-muted-foreground",
              depth === 0 && "font-medium",
            )}
          />
        }
      >
        {category.name}
      </DropdownMenuItem>
    );
  }

  return (
    <div className={cn(padClass)}>
      <div className="flex items-center gap-0.5">
        <DropdownMenuItem
          className="min-w-0 flex-1"
          render={
            <Link
              href={`/categories/${category.slug}`}
              className={cn(
                "cursor-pointer font-medium",
                depth > 0 && "font-normal text-muted-foreground",
              )}
            />
          }
        >
          {category.name}
        </DropdownMenuItem>
        <button
          type="button"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label={`${isOpen ? "Collapse" : "Expand"} ${category.name}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggle(category.id);
          }}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <ChevronDownIcon
            className={cn(
              "size-3.5 transition-transform duration-200 ease-out",
              isOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </div>

      <div
        id={panelId}
        role="region"
        aria-label={`${category.name} subcategories`}
        aria-hidden={!isOpen}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          {children.map((child) => (
            <DropdownCategoryBranch
              key={child.id}
              category={child}
              depth={depth + 1}
              openIds={openIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CategoriesNav({
  className,
  onNavigate,
  variant = "dropdown",
}: CategoriesNavProps) {
  const { data, isLoading, isError } = useCategories();
  const categories = sortCategoryTree(data ?? []);
  const { openIds, toggle } = useAccordionIds();

  if (variant === "stack") {
    return (
      <nav className={cn("space-y-1", className)} aria-label="Categories">
        <ul className="flex flex-col gap-0.5">
          <li>
            <Link
              href="/categories"
              onClick={onNavigate}
              className="block rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View all
            </Link>
          </li>
          {isLoading ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Loading…
            </li>
          ) : null}
          {isError ? (
            <li className="px-3 py-2 text-sm text-destructive">
              Could not load categories
            </li>
          ) : null}
          {!isLoading && !isError
            ? categories.map((category) => (
                <StackCategoryBranch
                  key={category.id}
                  category={category}
                  onNavigate={onNavigate}
                  openIds={openIds}
                  onToggle={toggle}
                />
              ))
            : null}
          {!isLoading && !isError && categories.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No categories yet
            </li>
          ) : null}
        </ul>
      </nav>
    );
  }

  return (
    <div className={cn(className)}>
      <NavHoverMenu
        aria-label="Categories menu"
        contentClassName="max-h-[min(70vh,28rem)] overflow-y-auto"
        label={
          <>
            Categories
            <ChevronDownIcon className="size-3.5 opacity-70" />
          </>
        }
      >
        <DropdownMenuItem
          render={<Link href="/categories" className="cursor-pointer" />}
        >
          View all categories
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            Loading…
          </div>
        ) : null}
        {isError ? (
          <div className="px-2 py-1.5 text-sm text-destructive">
            Could not load categories
          </div>
        ) : null}
        {!isLoading && !isError && categories.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No categories yet
          </div>
        ) : null}
        {!isLoading && !isError
          ? categories.map((category) => (
              <DropdownCategoryBranch
                key={category.id}
                category={category}
                openIds={openIds}
                onToggle={toggle}
              />
            ))
          : null}
      </NavHoverMenu>
    </div>
  );
}
