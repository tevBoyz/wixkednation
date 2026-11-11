"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { GasNationLoader } from "@/components/brand/gasnation-loader";
import { CheckoutAddressPicker } from "@/components/checkout/checkout-address-picker";
import { CheckoutOrderSummary } from "@/components/checkout/checkout-order-summary";
import { useAuth } from "@/components/providers/auth-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useFormatPrice } from "@/components/providers/store-config-provider";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UsPhoneInput,
  optionalUsPhoneLocalSchema,
  usPhoneLocalSchema,
} from "@/components/ui/us-phone-input";
import { createGuestOrder, createOrder } from "@/lib/api/orders.api";
import { validateStoreCoupon } from "@/lib/api/store-coupons.api";
import { getOrderSubmitErrorMessage, getErrorMessage } from "@/lib/api/errors";
import { saveGuestOrderSnapshot } from "@/lib/orders/guest-order-snapshot";
import {
  computeOrderTotals,
  DELIVERY_FEE,
  toMoneyNumber,
} from "@/lib/cart/delivery-fee";
import { zipCodeSchema } from "@/lib/delivery/zip-codes";
import { normalizePhone, toUsE164 } from "@/lib/phone";
import { useGuestCartStore } from "@/stores/guest-cart-store";
import type { CouponType } from "@/lib/api/types";

const guestCheckoutSchema = z.object({
  phone: usPhoneLocalSchema(),
  name: z.string().max(120),
  fullName: z.string().trim().min(1, "Full name is required").max(120),
  addressPhone: optionalUsPhoneLocalSchema(),
  addressLine1: z.string().trim().min(1, "Address is required").max(200),
  addressLine2: z.string().max(200),
  city: z.string().trim().min(1, "City is required").max(120),
  state: z.string().max(120),
  postalCode: zipCodeSchema(),
});

type GuestCheckoutValues = z.infer<typeof guestCheckoutSchema>;

export function CheckoutPageClient() {
  const formatPrice = useFormatPrice();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, itemCount, subtotal, isLoading, refresh } = useCart();
  const guestClear = useGuestCartStore((state) => state.clear);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
    null,
  );
  const submitLockRef = useRef(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(
    null,
  );
  const [couponType, setCouponType] = useState<CouponType | null>(null);
  const [couponAmount, setCouponAmount] = useState<number | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  const totals = computeOrderTotals({
    subtotal,
    couponType,
    couponAmount,
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestCheckoutValues>({
    resolver: zodResolver(guestCheckoutSchema),
    defaultValues: {
      phone: "",
      name: "",
      fullName: "",
      addressPhone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
    }
  }, [isAuthenticated, refresh]);

  async function onApplyCoupon() {
    const code = couponInput.trim();
    if (!code) {
      toast.error("Enter a coupon code");
      return;
    }
    setCouponBusy(true);
    try {
      const result = await validateStoreCoupon({
        code,
        subtotal,
      });
      setAppliedCouponCode(result.coupon.code);
      setCouponType(result.type);
      setCouponAmount(
        result.coupon.amount != null
          ? toMoneyNumber(result.coupon.amount)
          : null,
      );
      setCouponInput(result.coupon.code);
      toast.success("Coupon applied");
    } catch (error) {
      setAppliedCouponCode(null);
      setCouponType(null);
      setCouponAmount(null);
      toast.error(getErrorMessage(error, "Invalid coupon"));
    } finally {
      setCouponBusy(false);
    }
  }

  function onClearCoupon() {
    setAppliedCouponCode(null);
    setCouponType(null);
    setCouponAmount(null);
    setCouponInput("");
  }

  async function onPlaceSignedInOrder() {
    if (!selectedAddressId) {
      toast.error("Select a delivery address");
      return;
    }

    if (submitLockRef.current || submitting) {
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    setSubmitErrorMessage(null);

    try {
      const order = await createOrder({
        addressId: selectedAddressId,
        paymentMethod: "COD",
        couponCode: appliedCouponCode || undefined,
      });

      router.replace(`/order-success/${order.id}`);
      void refresh();
      router.refresh();
    } catch (error) {
      const message = getOrderSubmitErrorMessage(error);
      setSubmitErrorMessage(message);
      toast.error(message);
      submitLockRef.current = false;
      setSubmitting(false);
    }
  }

  async function onPlaceGuestOrder(values: GuestCheckoutValues) {
    if (submitLockRef.current || submitting) {
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    setSubmitErrorMessage(null);

    const phone = normalizePhone(toUsE164(values.phone));
    const addressPhoneRaw = values.addressPhone.trim();
    const addressPhone = addressPhoneRaw
      ? normalizePhone(toUsE164(addressPhoneRaw))
      : phone;

    try {
      const result = await createGuestOrder({
        phone,
        name: values.name.trim() || undefined,
        paymentMethod: "COD",
        couponCode: appliedCouponCode || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          skuId: item.skuId,
          quantity: item.quantity,
        })),
        address: {
          fullName: values.fullName.trim(),
          phone: addressPhone,
          addressLine1: values.addressLine1.trim(),
          addressLine2: values.addressLine2.trim() || null,
          city: values.city.trim(),
          state: values.state.trim() || null,
          postalCode: values.postalCode.trim(),
          country: "United States",
        },
      });

      saveGuestOrderSnapshot(result);
      router.replace(`/order-success/${result.order.id}`);
      guestClear();
      router.refresh();
    } catch (error) {
      const message = getOrderSubmitErrorMessage(error);
      setSubmitErrorMessage(message);
      toast.error(message);
      submitLockRef.current = false;
      setSubmitting(false);
    }
  }

  if (authLoading || isLoading) {
    return (
      <Container as="main" className="py-10">
        <p className="text-sm text-muted-foreground">Loading checkout…</p>
      </Container>
    );
  }

  if (itemCount === 0 && !submitting) {
    return (
      <Container as="main" className="py-10">
        <h1>Checkout</h1>
        <p className="mt-2 text-muted-foreground">
          Your cart is empty. Add products before checking out.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button render={<Link href="/products" />} nativeButton={false}>
            Browse products
          </Button>
          <Button
            render={<Link href="/cart" />}
            nativeButton={false}
            variant="outline"
          >
            View cart
          </Button>
        </div>
      </Container>
    );
  }

  const placingOrderOverlay = submitting ? (
    <GasNationLoader
      variant="fullscreen"
      message="Placing your order…"
      className="gn-loader-backdrop bg-background/95"
    />
  ) : null;

  const submitErrorBanner = submitErrorMessage ? (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      {submitErrorMessage}
    </div>
  ) : null;

  const couponSection = (
    <section aria-labelledby="checkout-coupon-heading" className="space-y-3">
      <h2 id="checkout-coupon-heading" className="text-lg font-medium">
        Coupon
      </h2>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="checkout-coupon">Code</Label>
          <Input
            id="checkout-coupon"
            value={couponInput}
            onChange={(event) => setCouponInput(event.target.value)}
            placeholder="Enter code"
            disabled={couponBusy || submitting}
            autoCapitalize="characters"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={couponBusy || submitting}
            onClick={() => void onApplyCoupon()}
          >
            {couponBusy ? "Checking…" : "Apply"}
          </Button>
          {appliedCouponCode ? (
            <Button
              type="button"
              variant="ghost"
              disabled={couponBusy || submitting}
              onClick={onClearCoupon}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );

  const summaryProps = {
    productDiscount: totals.productDiscount,
    deliveryFee: totals.deliveryFee,
    couponCode: appliedCouponCode,
  };

  if (isAuthenticated) {
    return (
      <>
        {placingOrderOverlay}
        <Container as="main" className="min-w-0 py-10">
        <header className="max-w-2xl min-w-0">
          <h1>Checkout</h1>
          <p className="mt-2 text-muted-foreground">
            Choose a delivery address and confirm your Cash on Delivery order.
          </p>
        </header>

        {submitErrorBanner ? <div className="mt-6">{submitErrorBanner}</div> : null}

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 space-y-8">
            <section aria-labelledby="checkout-address-heading">
              <h2
                id="checkout-address-heading"
                className="text-lg font-medium"
              >
                Delivery address
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select a saved address or add a new one.
              </p>
              <div className="mt-4">
                <CheckoutAddressPicker
                  selectedId={selectedAddressId}
                  onSelect={setSelectedAddressId}
                />
              </div>
            </section>

            {couponSection}

            <section aria-labelledby="checkout-payment-heading">
              <h2
                id="checkout-payment-heading"
                className="text-lg font-medium"
              >
                Payment
              </h2>
              <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
                <p className="font-medium">Cash on Delivery (COD)</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pay {formatPrice(totals.total)} when your order is delivered
                  (includes ${DELIVERY_FEE} delivery
                  {totals.deliveryFee === 0 ? ", waived by coupon" : ""}).
                  Online payment is not available.
                </p>
              </div>
            </section>

            <div className="lg:hidden">
              <Button
                type="button"
                className="w-full"
                disabled={!selectedAddressId || submitting}
                onClick={() => void onPlaceSignedInOrder()}
              >
                {submitting ? "Placing order…" : "Place order"}
              </Button>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-20">
            <CheckoutOrderSummary {...summaryProps} />
            <Button
              type="button"
              className="hidden w-full lg:inline-flex"
              disabled={!selectedAddressId || submitting}
              onClick={() => void onPlaceSignedInOrder()}
            >
              {submitting ? "Placing order…" : "Place order"}
            </Button>
          </div>
        </div>
      </Container>
      </>
    );
  }

  return (
    <>
      {placingOrderOverlay}
      <Container as="main" className="min-w-0 py-10">
      <header className="max-w-2xl min-w-0">
        <h1>Checkout</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your phone and delivery details to place a Cash on Delivery
          order. No account required.
        </p>
      </header>

      {submitErrorBanner ? <div className="mt-6">{submitErrorBanner}</div> : null}

      <form
        className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]"
        onSubmit={handleSubmit((values) => void onPlaceGuestOrder(values))}
        noValidate
      >
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="checkout-contact-heading" className="space-y-4">
            <div>
              <h2
                id="checkout-contact-heading"
                className="text-lg font-medium"
              >
                Contact
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We use this number for delivery updates.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-phone">Phone number</Label>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <UsPhoneInput
                    id="guest-phone"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(errors.phone)}
                    disabled={submitting}
                  />
                )}
              />
              {errors.phone ? (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Enter your 10-digit US mobile number.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-name">Name (optional)</Label>
              <Input
                id="guest-name"
                type="text"
                autoComplete="name"
                disabled={submitting}
                {...register("name")}
              />
            </div>
          </section>

          <section
            aria-labelledby="checkout-guest-address-heading"
            className="space-y-4"
          >
            <div>
              <h2
                id="checkout-guest-address-heading"
                className="text-lg font-medium"
              >
                Delivery address
              </h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-full-name">Full name</Label>
              <Input
                id="guest-full-name"
                type="text"
                autoComplete="name"
                aria-invalid={Boolean(errors.fullName)}
                disabled={submitting}
                {...register("fullName")}
              />
              {errors.fullName ? (
                <p className="text-sm text-destructive">
                  {errors.fullName.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-address-phone">
                Delivery phone (optional)
              </Label>
              <Controller
                control={control}
                name="addressPhone"
                render={({ field }) => (
                  <UsPhoneInput
                    id="guest-address-phone"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(errors.addressPhone)}
                    disabled={submitting}
                    placeholder="Same as contact if blank"
                  />
                )}
              />
              {errors.addressPhone ? (
                <p className="text-sm text-destructive">
                  {errors.addressPhone.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-address-line1">Address</Label>
              <Input
                id="guest-address-line1"
                type="text"
                autoComplete="street-address"
                aria-invalid={Boolean(errors.addressLine1)}
                disabled={submitting}
                {...register("addressLine1")}
              />
              {errors.addressLine1 ? (
                <p className="text-sm text-destructive">
                  {errors.addressLine1.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-address-line2">
                Address line 2 (optional)
              </Label>
              <Input
                id="guest-address-line2"
                type="text"
                disabled={submitting}
                {...register("addressLine2")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guest-city">City</Label>
                <Input
                  id="guest-city"
                  type="text"
                  autoComplete="address-level2"
                  aria-invalid={Boolean(errors.city)}
                  disabled={submitting}
                  {...register("city")}
                />
                {errors.city ? (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest-state">State (optional)</Label>
                <Input
                  id="guest-state"
                  type="text"
                  autoComplete="address-level1"
                  disabled={submitting}
                  {...register("state")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-postalCode">ZIP code</Label>
              <Input
                id="guest-postalCode"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="22201"
                maxLength={10}
                aria-invalid={Boolean(errors.postalCode)}
                disabled={submitting}
                {...register("postalCode")}
              />
              {errors.postalCode ? (
                <p className="text-sm text-destructive">
                  {errors.postalCode.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  We deliver in Northern Virginia, Washington DC, and South Maryland.
                </p>
              )}
            </div>
          </section>

          {couponSection}

          <section aria-labelledby="checkout-guest-payment-heading">
            <h2
              id="checkout-guest-payment-heading"
              className="text-lg font-medium"
            >
              Payment
            </h2>
            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
              <p className="font-medium">Cash on Delivery (COD)</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pay {formatPrice(totals.total)} when your order is delivered
                (includes ${DELIVERY_FEE} delivery
                {totals.deliveryFee === 0 ? ", waived by coupon" : ""}). Online
                payment is not available.
              </p>
            </div>
          </section>

          <div className="lg:hidden">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Placing order…" : "Place order"}
            </Button>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20">
          <CheckoutOrderSummary {...summaryProps} />
          <Button
            type="submit"
            className="hidden w-full lg:inline-flex"
            disabled={submitting}
          >
            {submitting ? "Placing order…" : "Place order"}
          </Button>
        </div>
      </form>
    </Container>
    </>
  );
}
