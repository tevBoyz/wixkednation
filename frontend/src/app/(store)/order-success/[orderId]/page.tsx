import { Suspense } from "react";

import { OrderSuccessClient } from "@/components/checkout/order-success-client";

function SuccessFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">Loading order…</p>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <OrderSuccessClient />
    </Suspense>
  );
}
