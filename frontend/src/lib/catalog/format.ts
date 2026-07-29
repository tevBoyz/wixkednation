import { getDefaultProductImageUrl } from "@/lib/catalog/default-product-image";
import {
  DEFAULT_CURRENCY,
  getCurrencyLocale,
  normalizeStoreCurrency,
  type StoreCurrency,
} from "@/lib/catalog/currency";

/** Format a numeric amount using the store's display currency. */
export function formatPrice(
  value: number | string | null | undefined,
  currency: StoreCurrency | string = DEFAULT_CURRENCY,
): string {
  const amount =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  const resolvedCurrency = normalizeStoreCurrency(currency);

  if (!Number.isFinite(amount)) {
    return "-";
  }

  return new Intl.NumberFormat(getCurrencyLocale(resolvedCurrency), {
    style: "currency",
    currency: resolvedCurrency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** True when the product has a sellable (non-null, finite) price. */
export function hasProductPrice(
  value: number | string | null | undefined,
): boolean {
  if (value === null || value === undefined || value === "") {
    return false;
  }
  const amount =
    typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(amount);
}

function parseNumericAmount(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const amount =
    typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(amount) ? amount : null;
}

/** Sellable pack: price set and volume > 0. */
export function hasSellablePack(product: {
  price?: number | string | null;
  volume?: number | string | null;
}): boolean {
  const price = parseNumericAmount(product.price);
  const volume = parseNumericAmount(product.volume);
  return price != null && volume != null && volume > 0;
}

/** Storefront product price - contact CTA when pack is not sellable. */
export function formatProductPrice(
  value: number | string | null | undefined,
  currency: StoreCurrency | string = DEFAULT_CURRENCY,
): string {
  if (!hasProductPrice(value)) {
    return "Contact for price";
  }
  return formatPrice(value, currency);
}

/**
 * Pack price label, e.g. `Br 2,800 / 1 g`.
 * Falls back to contact CTA when price or volume is unset.
 */
export function formatPackPrice(
  product: {
    price?: number | string | null;
    volume?: number | string | null;
    measurementUnit?: string | null;
  },
  currency: StoreCurrency | string = DEFAULT_CURRENCY,
): string {
  if (!hasSellablePack(product)) {
    return "Contact for price";
  }
  const pack = formatVolumeUnit(product.volume, product.measurementUnit);
  const priceLabel = formatPrice(product.price, currency);
  return pack ? `${priceLabel} / ${pack}` : priceLabel;
}

/** volume × quantity (or API effectiveVolume when provided). */
export function resolveEffectiveVolume(
  volume: number | string | null | undefined,
  quantity: number,
  effectiveVolume?: number | string | null,
): number | string | null {
  if (effectiveVolume != null && effectiveVolume !== "") {
    return effectiveVolume;
  }
  const base = parseNumericAmount(volume);
  if (base == null) {
    return null;
  }
  return base * quantity;
}

/** Format a cannabinoid percent for display (e.g. `22%`). */
export function formatPercentLabel(
  value: number | string | null | undefined,
): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const amount =
    typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(amount)) {
    return null;
  }
  return `${amount % 1 === 0 ? amount.toFixed(0) : String(amount)}%`;
}

/** Compact THC/CBD line, e.g. `THC 22% · CBD 1%`. */
export function formatCannabinoidLine(product: {
  thcPercent?: number | string | null;
  cbdPercent?: number | string | null;
}): string | null {
  const parts: string[] = [];
  const thc = formatPercentLabel(product.thcPercent);
  const cbd = formatPercentLabel(product.cbdPercent);
  if (thc) parts.push(`THC ${thc}`);
  if (cbd) parts.push(`CBD ${cbd}`);
  return parts.length ? parts.join(" · ") : null;
}

export function formatVolumeUnit(
  volume: number | string | null | undefined,
  measurementUnit: string | null | undefined,
): string | null {
  const unit = measurementUnit?.trim();
  if (!unit) {
    return null;
  }

  if (volume === null || volume === undefined || volume === "") {
    return unit;
  }

  const amount =
    typeof volume === "number" ? volume : Number.parseFloat(String(volume));

  if (!Number.isFinite(amount)) {
    return unit;
  }

  return `${amount} ${unit}`;
}

export function getProductCoverUrl(product: {
  images?: Array<{ url?: string | null }> | null;
  coverImageIndex?: number | null;
}): string {
  const images = product.images;
  if (!images?.length) {
    return getDefaultProductImageUrl();
  }

  const index = Math.min(
    Math.max(product.coverImageIndex ?? 0, 0),
    images.length - 1,
  );
  const url = images[index]?.url;
  return url?.trim() ? url : getDefaultProductImageUrl();
}
