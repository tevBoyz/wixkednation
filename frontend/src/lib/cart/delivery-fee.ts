export const DELIVERY_FEE = 20;

export function toMoneyNumber(value: number | string | null | undefined): number {
  const amount =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return Math.round(amount * 100) / 100;
}

export type CouponType = "free_delivery" | "fixed_amount" | "percent_off";

export type OrderTotalsBreakdown = {
  subtotal: number;
  productDiscount: number;
  discountedSubtotal: number;
  deliveryFee: number;
  deliveryFeeBefore: number;
  total: number;
};

export function computeOrderTotals(input: {
  subtotal: number | string;
  couponType?: CouponType | null;
  couponAmount?: number | string | null;
}): OrderTotalsBreakdown {
  const subtotal = toMoneyNumber(input.subtotal);
  const couponType = input.couponType || null;
  const couponAmount = toMoneyNumber(input.couponAmount);

  let productDiscount = 0;
  let deliveryFee = DELIVERY_FEE;

  if (couponType === "percent_off") {
    const percent = Math.min(100, Math.max(0, couponAmount));
    productDiscount = toMoneyNumber((subtotal * percent) / 100);
  } else if (couponType === "fixed_amount") {
    productDiscount = Math.min(subtotal, Math.max(0, couponAmount));
  } else if (couponType === "free_delivery") {
    deliveryFee = 0;
  }

  productDiscount = Math.min(subtotal, Math.max(0, productDiscount));
  const discountedSubtotal = toMoneyNumber(subtotal - productDiscount);
  const total = toMoneyNumber(discountedSubtotal + deliveryFee);

  return {
    subtotal,
    productDiscount,
    discountedSubtotal,
    deliveryFee,
    deliveryFeeBefore: DELIVERY_FEE,
    total,
  };
}
