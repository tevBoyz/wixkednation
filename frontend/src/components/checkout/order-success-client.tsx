"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { getMyOrder } from "@/lib/api/orders.api";
import { getErrorMessage } from "@/lib/api/errors";
import { useFormatPrice } from "@/components/providers/store-config-provider";
import {
  readGuestOrderSnapshot,
  type GuestOrderSnapshot,
} from "@/lib/orders/guest-order-snapshot";
import type { Order } from "@/lib/api/types";
import { isValidUsPhone, normalizePhone } from "@/lib/phone";

function phoneQueryHref(path: string, phone?: string | null) {
  if (!phone) {
    return path;
  }
  const normalized = normalizePhone(phone);
  if (!normalized || !isValidUsPhone(normalized)) {
    return path;
  }
  const params = new URLSearchParams({ phone: normalized });
  return `${path}?${params.toString()}`;
}

function OrderSummaryCard({
  order,
  formatPrice,
}: {
  order: Order;
  formatPrice: (value: number | string | null | undefined) => string;
}) {
  const reference = order.orderNumber || order.id;

  return (
    <div className="mt-8 rounded-lg border border-border bg-muted/20 p-5 text-left">
      <dl className="space-y-3 text-sm">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted-foreground">Order reference</dt>
          <dd className="font-medium">{reference}</dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-medium">{order.status}</dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted-foreground">Payment</dt>
          <dd className="font-medium">Cash on Delivery</dd>
        </div>
        {order.totalAmount != null ? (
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-medium">{formatPrice(order.totalAmount)}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function GuestPostOrderCta({ snapshot }: { snapshot: GuestOrderSnapshot }) {
  const cta = snapshot.customer?.postOrderCta;
  const phone = snapshot.customer?.phone;

  if (cta === "register") {
    return (
      <div className="mt-8 flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 p-5 text-left">
        <p className="min-w-0 font-medium">
          Create an account to track order, and more
        </p>
        <Button
          render={<Link href={phoneQueryHref("/register", phone)} />}
          nativeButton={false}
          className="shrink-0"
        >
          Create account
        </Button>
      </div>
    );
  }

  if (cta === "login") {
    return (
      <div className="mt-8 flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 p-5 text-left">
        <p className="min-w-0 font-medium">Log in to check order status</p>
        <Button
          render={<Link href={phoneQueryHref("/login", phone)} />}
          nativeButton={false}
          className="shrink-0"
        >
          Log in
        </Button>
      </div>
    );
  }

  return null;
}

export function OrderSuccessClient() {
  const formatPrice = useFormatPrice();
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [guestSnapshot, setGuestSnapshot] = useState<GuestOrderSnapshot | null>(
    null,
  );
  const [guestHydrated, setGuestHydrated] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setGuestHydrated(true);
      return;
    }
    setGuestSnapshot(readGuestOrderSnapshot(orderId));
    setGuestHydrated(true);
  }, [orderId]);

  const {
    data: authedOrder,
    isLoading: orderLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["orders", "me", orderId],
    queryFn: () => getMyOrder(orderId),
    enabled: Boolean(orderId) && isAuthenticated && !authLoading,
  });

  if (authLoading || (isAuthenticated && orderLoading) || !guestHydrated) {
    return (
      <Container as="main" className="py-16">
        <p className="text-sm text-muted-foreground">Loading order…</p>
      </Container>
    );
  }

  if (isAuthenticated) {
    if (isError || !authedOrder) {
      return (
        <Container as="main" className="py-16">
          <h1>Order not found</h1>
          <p className="mt-2 text-sm text-destructive">
            {getErrorMessage(error, "Could not load this order")}
          </p>
          <Button
            render={<Link href="/account/orders" />}
            nativeButton={false}
            className="mt-6"
          >
            View my orders
          </Button>
        </Container>
      );
    }

    return (
      <Container as="main" className="flex flex-1 flex-col py-16">
        <div className="mx-auto w-full max-w-lg text-center">
          <p className="text-sm font-medium text-primary">Order placed</p>
          <h1 className="mt-2">Thank you for your order</h1>
          <p className="mt-3 text-muted-foreground">
            Your Cash on Delivery order has been received. We will contact you
            when it is on the way.
          </p>

          <OrderSummaryCard order={authedOrder} formatPrice={formatPrice} />

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              render={<Link href="/account/orders" />}
              nativeButton={false}
            >
              View my orders
            </Button>
            <Button
              render={<Link href="/products" />}
              nativeButton={false}
              variant="outline"
            >
              Continue shopping
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  if (!guestSnapshot) {
    return (
      <Container as="main" className="py-16">
        <div className="mx-auto w-full max-w-lg text-center">
          <h1>Order confirmation</h1>
          <p className="mt-3 text-muted-foreground">
            If you just placed an order, check your SMS or call us with your
            phone number. This confirmation page is only available right after
            checkout in this browser.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button render={<Link href="/products" />} nativeButton={false}>
              Continue shopping
            </Button>
            <Button
              render={<Link href="/login" />}
              nativeButton={false}
              variant="outline"
            >
              Log in
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container as="main" className="flex flex-1 flex-col py-16">
      <div className="mx-auto w-full max-w-lg text-center">
        <p className="text-sm font-medium text-primary">Order placed</p>
        <h1 className="mt-2">Thank you for your order</h1>
        <p className="mt-3 text-muted-foreground">
          Your Cash on Delivery order has been received. We will contact you
          when it is on the way.
        </p>

        <OrderSummaryCard
          order={guestSnapshot.order}
          formatPrice={formatPrice}
        />

        <GuestPostOrderCta snapshot={guestSnapshot} />

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button render={<Link href="/products" />} nativeButton={false}>
            Continue shopping
          </Button>
          <Button
            render={<Link href="/cart" />}
            nativeButton={false}
            variant="outline"
          >
            Back to cart
          </Button>
        </div>
      </div>
    </Container>
  );
}
