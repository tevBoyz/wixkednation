export const ALLOWED_CURRENCIES = ["ETB", "USD", "EUR", "GBP"] as const;

export type StoreCurrency = (typeof ALLOWED_CURRENCIES)[number];

/** Storefront default when AdminSettings / env has no currency. */
export const DEFAULT_CURRENCY: StoreCurrency = "USD";

/** Default pack unit for new products / settings fallbacks. */
export const DEFAULT_MEASUREMENT_UNIT = "oz";

export const CURRENCY_LABELS: Record<StoreCurrency, string> = {
  ETB: "Ethiopian Birr (ETB)",
  USD: "US Dollar (USD)",
  EUR: "Euro (EUR)",
  GBP: "British Pound (GBP)",
};

export function normalizeStoreCurrency(
  value?: string | null,
): StoreCurrency {
  const code = value?.trim().toUpperCase();
  if (code && ALLOWED_CURRENCIES.includes(code as StoreCurrency)) {
    return code as StoreCurrency;
  }
  return DEFAULT_CURRENCY;
}

export function getCurrencyLocale(currency: StoreCurrency): string {
  if (currency === "ETB") {
    return "en-ET";
  }
  return "en-US";
}
