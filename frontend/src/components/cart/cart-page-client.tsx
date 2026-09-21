"use client";

import Link from "next/link";

import { CartLineRow } from "@/components/cart/cart-line-row";
import { useCart } from "@/components/providers/cart-provider";
import { useFormatPrice } from "@/components/providers/store-config-provider";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export function CartPageClient() {
  const formatPrice = useFormatPrice();
  const { items, itemCount, subtotal, isLoading, clear } = useCart();

  const checkoutHref = "/checkout";

  async function onClear() {
    if (items.length === 0) {
      return;
    }
    const confirmed = window.confirm("Clear all items from your cart?");
    if (!confirmed) {
      return;
    }
    await clear();
  }

  return (
    <Container as="main" className="min-w-0 py-10">
      <header className="flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1>Cart</h1>
          <p className="mt-2 text-muted-foreground">
            {isLoading
              ? "Loading cart…"
              : itemCount === 0
                ? "Your cart is empty."
                : `${itemCount} item${itemCount === 1 ? "" : "s"}`}
          </p>
        </div>
        {items.length > 0 ? (
          <Button type="button" variant="ghost" onClick={() => void onClear()}>
            Clear cart
          </Button>
        ) : null}
      </header>

      {isLoading ? (
        <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {!isLoading && items.length === 0 ? (
        <div className="mt-10 flex flex-col items-start gap-4">
          <p className="text-muted-foreground">
            Add products from the catalog to get started.
          </p>
          <Button render={<Link href="/products" />} nativeButton={false}>
            Browse products
          </Button>
        </div>
      ) : null}

      {!isLoading && items.length > 0 ? (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <ul className="min-w-0">
            {items.map((line) => (
              <CartLineRow key={line.key} line={line} />
            ))}
          </ul>

          <aside className="h-fit rounded-lg border border-border p-4 lg:sticky lg:top-20">
            <h2 className="text-sm font-medium text-muted-foreground">
              Order summary
            </h2>
            <p className="mt-3 flex items-baseline justify-between gap-3 text-base">
              <span>Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Delivery ($20) is added at checkout.
            </p>
            <Button
              render={<Link href={checkoutHref} />}
              nativeButton={false}
              className="mt-4 w-full"
            >
              Checkout
            </Button>
            <Button
              render={<Link href="/products" />}
              nativeButton={false}
              variant="outline"
              className="mt-2 w-full"
            >
              Continue shopping
            </Button>
          </aside>
        </div>
      ) : null}
    </Container>
  );
}
