"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition, type FormEvent } from "react";

import type { Category } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { flattenCategoryTree } from "@/lib/catalog/category-tree";

type ProductsFiltersProps = {
  categories: Category[];
};

function buildProductsHref(values: {
  category?: string;
  search?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (values.category) {
    params.set("category", values.category);
  }
  if (values.search) {
    params.set("search", values.search);
  }
  if (values.page && values.page > 1) {
    params.set("page", String(values.page));
  }
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

export function ProductsFilters({ categories }: ProductsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const category = searchParams.get("category") || "";
  const searchFromUrl = searchParams.get("search") || "";
  const categoryOptions = useMemo(
    () => flattenCategoryTree(categories),
    [categories],
  );

  function navigate(next: { category?: string; search?: string; page?: number }) {
    startTransition(() => {
      router.push(buildProductsHref(next));
    });
  }

  function onCategoryChange(value: string) {
    navigate({
      category: value || undefined,
      search: searchFromUrl || undefined,
      page: 1,
    });
  }

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextSearch = String(formData.get("search") || "").trim();
    navigate({
      category: category || undefined,
      search: nextSearch || undefined,
      page: 1,
    });
  }

  function onClear() {
    navigate({});
  }

  const hasFilters = Boolean(category || searchFromUrl);

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:flex-wrap sm:items-end">
      <form
        key={searchFromUrl}
        onSubmit={onSearchSubmit}
        className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-sm"
      >
        <Label htmlFor="product-search">Search</Label>
        <div className="flex gap-2">
          <Input
            id="product-search"
            name="search"
            type="search"
            placeholder="Search products"
            defaultValue={searchFromUrl}
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending}>
            Search
          </Button>
        </div>
      </form>

      <div className="flex min-w-[12rem] flex-col gap-2">
        <Label htmlFor="product-category">Category</Label>
        <select
          id="product-category"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
          value={category}
          disabled={isPending}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="">All categories</option>
          {categoryOptions.map((item) => (
            <option key={item.id} value={item.category.slug}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={onClear}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
