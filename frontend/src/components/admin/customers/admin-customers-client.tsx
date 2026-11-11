"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import {
  AdminCustomersFilters,
  adminCustomersPaginationHref,
} from "@/components/admin/customers/admin-customers-filters";
import { listAdminCustomers } from "@/lib/api/admin/customers.api";
import { getErrorMessage } from "@/lib/api/errors";
import type { AdminCustomer } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

export const adminCustomersQueryKey = ["admin", "customers"] as const;

function formatCustomerDate(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return format(date, "MMM d, yyyy");
}

function customerLabel(customer: AdminCustomer) {
  return customer.name || customer.phone || customer.email || "-";
}

function CustomersTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

function AdminCustomersContent() {
  const searchParams = useSearchParams();

  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const search = searchParams.get("search")?.trim() || undefined;
  const filters = { search };

  const customersQuery = useQuery({
    queryKey: [...adminCustomersQueryKey, { page, search }],
    queryFn: () =>
      listAdminCustomers({
        page,
        limit: PAGE_SIZE,
        search,
      }),
    staleTime: 0,
  });

  const pagination = customersQuery.data?.pagination;
  const customers = customersQuery.data?.customers ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Accounts</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">Customers</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Reputation scores are visible here only - never on the storefront.
        </p>
      </div>

      <AdminCustomersFilters />

      {customersQuery.isLoading ? <CustomersTableSkeleton /> : null}

      {customersQuery.isError ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive" role="alert">
            {getErrorMessage(customersQuery.error, "Could not load customers")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void customersQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {customersQuery.data && customers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No customers match these filters.
          </p>
        </div>
      ) : null}

      {customers.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {pagination?.total ?? customers.length} customer
            {(pagination?.total ?? customers.length) === 1 ? "" : "s"}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Reputation</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium hover:underline"
                    >
                      {customerLabel(customer)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.phone || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.email || "-"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {customer.reputation?.reputationScore ?? 0}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {customer.orderCount ?? 0}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCustomerDate(customer.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      render={
                        <Link href={`/admin/customers/${customer.id}`} />
                      }
                      nativeButton={false}
                      variant="outline"
                      size="sm"
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                {pagination.page > 1 ? (
                  <Button
                    render={
                      <Link
                        href={adminCustomersPaginationHref(
                          pagination.page - 1,
                          filters,
                        )}
                      />
                    }
                    nativeButton={false}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                ) : null}
                {pagination.page < pagination.totalPages ? (
                  <Button
                    render={
                      <Link
                        href={adminCustomersPaginationHref(
                          pagination.page + 1,
                          filters,
                        )}
                      />
                    }
                    nativeButton={false}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function AdminCustomersClient() {
  return (
    <Suspense fallback={<CustomersTableSkeleton />}>
      <AdminCustomersContent />
    </Suspense>
  );
}
