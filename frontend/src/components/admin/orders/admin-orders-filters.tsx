"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, type FormEvent } from "react";

import {
  ADMIN_ORDER_STATUSES,
  formatOrderStatus,
} from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50";

function buildAdminOrdersHref(values: {
  search?: string;
  status?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (values.search) {
    params.set("search", values.search);
  }
  if (values.status) {
    params.set("status", values.status);
  }
  if (values.page && values.page > 1) {
    params.set("page", String(values.page));
  }
  const qs = params.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export function AdminOrdersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const status = searchParams.get("status") || "";
  const searchFromUrl = searchParams.get("search") || "";

  function navigate(next: { search?: string; status?: string; page?: number }) {
    startTransition(() => {
      router.push(buildAdminOrdersHref(next));
    });
  }

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextSearch = String(formData.get("search") || "").trim();
    navigate({
      status: status || undefined,
      search: nextSearch || undefined,
      page: 1,
    });
  }

  const hasFilters = Boolean(status || searchFromUrl);

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:flex-wrap lg:items-end">
      <form
        key={searchFromUrl}
        onSubmit={onSearchSubmit}
        className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-sm"
      >
        <Label htmlFor="admin-order-search">Search</Label>
        <div className="flex gap-2">
          <Input
            id="admin-order-search"
            name="search"
            type="search"
            placeholder="Order #, name, phone, email…"
            defaultValue={searchFromUrl}
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending}>
            Search
          </Button>
        </div>
      </form>

      <div className="flex min-w-[12rem] flex-col gap-2">
        <Label htmlFor="admin-order-status">Status</Label>
        <select
          id="admin-order-status"
          className={selectClassName}
          value={status}
          disabled={isPending}
          onChange={(event) =>
            navigate({
              status: event.target.value || undefined,
              search: searchFromUrl || undefined,
              page: 1,
            })
          }
        >
          <option value="">All statuses</option>
          {ADMIN_ORDER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {formatOrderStatus(item)}
            </option>
          ))}
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

export function adminOrdersPaginationHref(
  page: number,
  filters: { search?: string; status?: OrderStatus | string },
): string {
  return buildAdminOrdersHref({ ...filters, page });
}
