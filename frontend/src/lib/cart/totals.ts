/** Shared cart amount helpers (guest + server cart UI). */

export function toCartAmount(value: number | string | null | undefined): number {
  const amount =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(amount) ? amount : 0;
}

export function computeLineTotal(
  price: number | string | null | undefined,
  quantity: number,
): number {
  const qty = Math.max(0, Math.floor(quantity));
  return toCartAmount(price) * qty;
}

export function computeCartSubtotal(
  lines: Array<{ lineTotal: number }>,
): number {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0);
}

export function computeCartItemCount(
  lines: Array<{ quantity: number }>,
): number {
  return lines.reduce((sum, line) => sum + Math.max(0, Math.floor(line.quantity)), 0);
}
