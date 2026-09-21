/**
 * Shared order totals: product discounts apply before the flat delivery fee.
 *
 * subtotal → productDiscount → deliveryFee ($20 or $0) → total
 */

const DELIVERY_FEE = 20;

function toMoneyNumber(value) {
  const amount =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return Math.round(amount * 100) / 100;
}

function moneyString(value) {
  return toMoneyNumber(value).toFixed(2);
}

/**
 * @param {object} input
 * @param {number|string} input.subtotal
 * @param {'free_delivery'|'fixed_amount'|'percent_off'|null} [input.couponType]
 * @param {number|string|null} [input.couponAmount]
 */
function computeOrderTotals(input = {}) {
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
    subtotalAmount: moneyString(subtotal),
    discountAmount: moneyString(productDiscount),
    deliveryFeeAmount: moneyString(deliveryFee),
    totalAmount: moneyString(total),
  };
}

module.exports = {
  DELIVERY_FEE,
  toMoneyNumber,
  moneyString,
  computeOrderTotals,
};
