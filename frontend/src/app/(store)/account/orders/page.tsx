import { Suspense } from "react";

import { OrdersListClient } from "@/components/orders/orders-list-client";

export default function AccountOrdersPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Orders</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Track deliveries and view order details.
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading orders…</p>
        }
      >
        <OrdersListClient />
      </Suspense>
    </section>
  );
}
