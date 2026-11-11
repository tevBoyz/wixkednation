"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
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
import {
  getDashboardStats,
  getRecentOrders,
  type DashboardStats,
  type SmsDashboardStatus,
} from "@/lib/api/admin/dashboard.api";
import { getErrorMessage } from "@/lib/api/errors";
import { useFormatPrice } from "@/components/providers/store-config-provider";

function formatOrderDate(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return format(date, "MMM d, yyyy · h:mm a");
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function providerLabel(provider?: string) {
  if (provider === "twilio") {
    return "Twilio";
  }
  if (provider === "mock") {
    return "Mock";
  }
  return provider || "Unknown";
}

function SmsStatusCard({ sms }: { sms: SmsDashboardStatus }) {
  const active = providerLabel(sms.activeProvider);
  const twilio = sms.twilio;
  let healthLabel = "Not configured";
  let healthHint = twilio.error || "Add Twilio env vars on the backend.";

  if (twilio.configured) {
    if (twilio.reachable === true) {
      healthLabel = twilio.accountStatus
        ? `Reachable · ${twilio.accountStatus}`
        : "Reachable";
      healthHint = "Twilio account API responded successfully.";
    } else if (twilio.reachable === false) {
      healthLabel = "Unreachable";
      healthHint = twilio.error || "Could not reach Twilio.";
    } else {
      healthLabel = "Configured";
      healthHint = "Credentials present; status not checked.";
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">SMS service</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            Active: {active}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Twilio:{" "}
            <span className="font-medium text-foreground">{healthLabel}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{healthHint}</p>
        </div>
        <Button
          render={<Link href="/admin/settings" />}
          nativeButton={false}
          variant="outline"
          size="sm"
        >
          Switch provider
        </Button>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 9 }).map((_, index) => (
        <Skeleton key={index} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}

function StatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.sms ? <SmsStatusCard sms={stats.sms} /> : null}
      <StatCard label="Total orders" value={stats.totalOrders} />
      <StatCard label="Pending" value={stats.pendingOrders} />
      <StatCard label="Confirmed" value={stats.confirmedOrders} />
      <StatCard
        label="Out for delivery"
        value={stats.outForDeliveryOrders}
      />
      <StatCard label="Delivered" value={stats.deliveredOrders} />
      <StatCard label="Cancelled" value={stats.cancelledOrders} />
      <StatCard
        label="Products"
        value={stats.totalProducts}
        hint={`${stats.visibleProducts} visible · ${stats.hiddenProducts} hidden`}
      />
      <StatCard label="Customers" value={stats.totalCustomers} />
    </div>
  );
}

function RecentOrdersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function AdminDashboardClient() {
  const formatPrice = useFormatPrice();
  const statsQuery = useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: getDashboardStats,
  });

  const recentQuery = useQuery({
    queryKey: ["admin", "dashboard", "recent-orders"],
    queryFn: () => getRecentOrders({ limit: 10 }),
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div>
        <p className="text-sm text-muted-foreground">Overview</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">
          Store dashboard
        </h2>
      </div>

      <section aria-labelledby="admin-stats-heading">
        <h3 id="admin-stats-heading" className="sr-only">
          Dashboard statistics
        </h3>
        {statsQuery.isLoading ? <StatsSkeleton /> : null}
        {statsQuery.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {getErrorMessage(statsQuery.error, "Could not load dashboard stats")}
          </p>
        ) : null}
        {statsQuery.data ? <StatsGrid stats={statsQuery.data} /> : null}
      </section>

      <section aria-labelledby="admin-recent-orders-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3
              id="admin-recent-orders-heading"
              className="text-lg font-medium"
            >
              Recent orders
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Latest activity across the store.
            </p>
          </div>
          <Button
            render={<Link href="/admin/orders" />}
            nativeButton={false}
            variant="outline"
            size="sm"
          >
            View all orders
          </Button>
        </div>

        {recentQuery.isLoading ? <RecentOrdersSkeleton /> : null}

        {recentQuery.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {getErrorMessage(
              recentQuery.error,
              "Could not load recent orders",
            )}
          </p>
        ) : null}

        {recentQuery.data && recentQuery.data.orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : null}

        {recentQuery.data && recentQuery.data.orders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentQuery.data.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.orderNumber || order.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.user?.name ||
                      order.user?.phone ||
                      order.user?.email ||
                      "-"}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatOrderDate(order.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </section>
    </div>
  );
}
