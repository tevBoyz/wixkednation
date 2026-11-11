import { Suspense, type ReactNode } from "react";

function CheckoutFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">Loading checkout…</p>
    </div>
  );
}

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<CheckoutFallback />}>{children}</Suspense>;
}
