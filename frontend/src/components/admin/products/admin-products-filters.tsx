"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, type FormEvent } from "react";

import type { Category } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { flattenCategoryTree } from "@/lib/catalog/category-tree";
import { useMemo } from "react";

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50";

type AdminProductsFiltersProps = {
  categories: Category[];
};

function buildAdminProductsHref(values: {
  category?: string;
  search?: string;
  visibility?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (values.category) {
    params.set("category", values.category);
  }
  if (values.search) {
    params.set("search", values.search);
  }
  if (values.visibility) {
    params.set("visibility", values.visibility);
  }
  if (values.page && values.page > 1) {
    params.set("page", String(values.page));
  }
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export function AdminProductsFilters({ categories }: AdminProductsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const category = searchParams.get("category") || "";
  const searchFromUrl = searchParams.get("search") || "";
  const visibility = searchParams.get("visibility") || "";

  const categoryOptions = useMemo(
    () => flattenCategoryTree(categories),
    [categories],
  );

  function navigate(next: {
    category?: string;
    search?: string;
    visibility?: string;
    page?: number;
  }) {
    startTransition(() => {
      router.push(buildAdminProductsHref(next));
    });
  }

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextSearch = String(formData.get("search") || "").trim();
    navigate({
      category: category || undefined,
      search: nextSearch || undefined,
      visibility: visibility || undefined,
      page: 1,
    });
  }

  const hasFilters = Boolean(category || searchFromUrl || visibility);

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:flex-wrap lg:items-end">
      <form
        key={searchFromUrl}
        onSubmit={onSearchSubmit}
        className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-sm"
      >
        <Label htmlFor="admin-product-search">Search</Label>
        <div className="flex gap-2">
          <Input
            id="admin-product-search"
            name="search"
            type="search"
            placeholder="Name, slug, description…"
            defaultValue={searchFromUrl}
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending}>
            Search
          </Button>
        </div>
      </form>

      <div className="flex min-w-[12rem] flex-col gap-2">
        <Label htmlFor="admin-product-category">Category</Label>
        <select
          id="admin-product-category"
          className={selectClassName}
          value={category}
          disabled={isPending}
          onChange={(event) =>
            navigate({
              category: event.target.value || undefined,
              search: searchFromUrl || undefined,
              visibility: visibility || undefined,
              page: 1,
            })
          }
        >
          <option value="">All categories</option>
          {categoryOptions.map((item) => (
            <option key={item.id} value={item.category.slug}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex min-w-[10rem] flex-col gap-2">
        <Label htmlFor="admin-product-visibility">Visibility</Label>
        <select
          id="admin-product-visibility"
          className={selectClassName}
          value={visibility}
          disabled={isPending}
          onChange={(event) =>
            navigate({
              category: category || undefined,
              search: searchFromUrl || undefined,
              visibility: event.target.value || undefined,
              page: 1,
            })
          }
        >
          <option value="">All</option>
          <option value="true">Visible only</option>
          <option value="false">Hidden only</option>
        </select>
      </div>

      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={() => navigate({})}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

export function adminProductsPaginationHref(
  page: number,
  filters: { category?: string; search?: string; visibility?: string },
): string {
  return buildAdminProductsHref({ ...filters, page });
}
