"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function buildAdminCustomersHref(values: {
  search?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (values.search) {
    params.set("search", values.search);
  }
  if (values.page && values.page > 1) {
    params.set("page", String(values.page));
  }
  const qs = params.toString();
  return qs ? `/admin/customers?${qs}` : "/admin/customers";
}

export function AdminCustomersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const searchFromUrl = searchParams.get("search") || "";

  function navigate(next: { search?: string; page?: number }) {
    startTransition(() => {
      router.push(buildAdminCustomersHref(next));
    });
  }

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextSearch = String(formData.get("search") || "").trim();
    navigate({
      search: nextSearch || undefined,
      page: 1,
    });
  }

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:flex-wrap lg:items-end">
      <form
        key={searchFromUrl}
        onSubmit={onSearchSubmit}
        className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-sm"
      >
        <Label htmlFor="admin-customer-search">Search</Label>
        <div className="flex gap-2">
          <Input
            id="admin-customer-search"
            name="search"
            type="search"
            placeholder="Name, phone, email…"
            defaultValue={searchFromUrl}
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending}>
            Search
          </Button>
        </div>
      </form>

      {searchFromUrl ? (
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

export function adminCustomersPaginationHref(
  page: number,
  filters: { search?: string },
): string {
  return buildAdminCustomersHref({ ...filters, page });
}
