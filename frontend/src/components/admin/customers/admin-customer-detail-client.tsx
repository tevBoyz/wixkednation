"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeftIcon } from "lucide-react";
import { Suspense, useTransition } from "react";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import {
  getAdminCustomer,
  getAdminCustomerOrders,
} from "@/lib/api/admin/customers.api";
import { getErrorMessage } from "@/lib/api/errors";
import { useFormatPrice } from "@/components/providers/store-config-provider";
import {
  ADMIN_ORDER_STATUSES,
  formatOrderStatus,
} from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ORDER_PAGE_SIZE = 10;

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50";

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return format(date, "MMM d, yyyy · h:mm a");
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function AdminCustomerDetailContent({ customerId }: { customerId: string }) {
  const formatPrice = useFormatPrice();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const orderPage = Math.max(
    1,
    Number.parseInt(searchParams.get("orderPage") || "1", 10) || 1,
  );
  const orderStatus = (searchParams.get("orderStatus")?.trim() ||
    undefined) as OrderStatus | undefined;

  const customerQuery = useQuery({
    queryKey: ["admin", "customers", customerId],
    queryFn: () => getAdminCustomer(customerId),
  });

  const ordersQuery = useQuery({
    queryKey: [
      "admin",
      "customers",
      customerId,
      "orders",
      { orderPage, orderStatus },
    ],
    queryFn: () =>
      getAdminCustomerOrders(customerId, {
        page: orderPage,
        limit: ORDER_PAGE_SIZE,
        status: orderStatus,
      }),
    enabled: Boolean(customerQuery.data),
  });

  if (customerQuery.isLoading) {
    return <DetailSkeleton />;
  }

  if (customerQuery.isError || !customerQuery.data) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Customer not found</h2>
        <p className="text-sm text-destructive">
          {getErrorMessage(customerQuery.error, "Could not load customer")}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void customerQuery.refetch()}
          >
            Try again
          </Button>
          <Button
            render={<Link href="/admin/customers" />}
            nativeButton={false}
            variant="outline"
          >
            Back to customers
          </Button>
        </div>
      </div>
    );
  }

  const { customer, orderCount, recentOrders } = customerQuery.data;
  const reputation = customer.reputation;
  const displayName =
    customer.name || customer.phone || customer.email || "Customer";
  const orders = ordersQuery.data?.orders ?? [];
  const orderPagination = ordersQuery.data?.pagination;

  function buildOrdersHref(next: {
    orderPage?: number;
    orderStatus?: OrderStatus | "";
  }) {
    const params = new URLSearchParams();
    const page = next.orderPage ?? orderPage;
    const status =
      next.orderStatus === undefined ? orderStatus : next.orderStatus || undefined;

    if (page > 1) {
      params.set("orderPage", String(page));
    }
    if (status) {
      params.set("orderStatus", status);
    }

    const qs = params.toString();
    return qs
      ? `/admin/customers/${customerId}?${qs}`
      : `/admin/customers/${customerId}`;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div>
        <Button
          render={<Link href="/admin/customers" />}
          nativeButton={false}
          variant="outline"
          size="sm"
          className="mb-4 gap-2"
        >
          <ArrowLeftIcon className="size-4" />
          Back to customers
        </Button>
        <p className="text-sm text-muted-foreground">Customer profile</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">
          {displayName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Joined {formatDateTime(customer.createdAt)}
          {customer.authProvider
            ? ` · Signed up via ${customer.authProvider}`
            : null}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Contact
            </h3>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="mt-1 font-medium">{customer.phone || "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="mt-1 font-medium">{customer.email || "-"}</dd>
              </div>
            </dl>
          </section>

          {recentOrders.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Recent orders (preview)
              </h3>
              <ul className="space-y-2">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40"
                    >
                      <span className="font-medium">
                        {order.orderNumber || order.id.slice(0, 8)}
                      </span>
                      <span className="flex items-center gap-2">
                        <OrderStatusBadge status={order.status} />
                        <span className="text-muted-foreground">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-medium">Order history</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {orderCount} total order{orderCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex min-w-[12rem] flex-col gap-2">
                <Label htmlFor="admin-customer-order-status">Status</Label>
                <select
                  id="admin-customer-order-status"
                  className={selectClassName}
                  value={orderStatus || ""}
                  disabled={isPending}
                  onChange={(event) => {
                    startTransition(() => {
                      router.push(
                        buildOrdersHref({
                          orderPage: 1,
                          orderStatus: event.target.value as OrderStatus | "",
                        }),
                      );
                    });
                  }}
                >
                  <option value="">All statuses</option>
                  {ADMIN_ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {formatOrderStatus(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {ordersQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : null}

            {ordersQuery.isError ? (
              <p className="text-sm text-destructive">
                {getErrorMessage(
                  ordersQuery.error,
                  "Could not load order history",
                )}
              </p>
            ) : null}

            {ordersQuery.data && orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No orders match this filter.
              </p>
            ) : null}

            {orders.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Placed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-medium hover:underline"
                          >
                            {order.orderNumber || order.id.slice(0, 8)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {orderPagination && orderPagination.totalPages > 1 ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      Page {orderPagination.page} of {orderPagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      {orderPagination.page > 1 ? (
                        <Button
                          render={
                            <Link
                              href={buildOrdersHref({
                                orderPage: orderPagination.page - 1,
                              })}
                            />
                          }
                          nativeButton={false}
                          variant="outline"
                          size="sm"
                        >
                          Previous
                        </Button>
                      ) : null}
                      {orderPagination.page < orderPagination.totalPages ? (
                        <Button
                          render={
                            <Link
                              href={buildOrdersHref({
                                orderPage: orderPagination.page + 1,
                              })}
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
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Reputation
            </h3>
            <dl className="mt-4 grid gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">Score</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">
                  {reputation?.reputationScore ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Delivered</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">
                  {reputation?.deliveredOrderCount ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Cancelled</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">
                  {reputation?.cancelledOrderCount ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Total orders</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">
                  {orderCount}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

type AdminCustomerDetailClientProps = {
  customerId: string;
};

export function AdminCustomerDetailClient({
  customerId,
}: AdminCustomerDetailClientProps) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <AdminCustomerDetailContent customerId={customerId} />
    </Suspense>
  );
}
