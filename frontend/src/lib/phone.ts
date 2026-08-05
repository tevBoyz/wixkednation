/** Match backend `src/utils/phone.js` rules. */

/** NANP area codes we deliver to: NoVA, DC, South / suburban Maryland. */
export const DELIVERY_AREA_CODES = new Set([
  "703",
  "571",
  "202",
  "771",
  "301",
  "240",
]);

export const DELIVERY_AREA_MESSAGE =
  "This area is not available for delivery. We currently deliver in Northern Virginia, Washington DC, and South Maryland.";

export function normalizePhone(phone: string): string {
  if (!phone || typeof phone !== "string") {
    return "";
  }

  let value = phone.trim().replace(/[\s().\-]/g, "");

  if (!value) {
    return "";
  }

  // Ethiopian local / national forms first (09…/07… are 10 digits and must
  // not be treated as US NANP).
  if (/^09\d{8}$/.test(value) || /^07\d{8}$/.test(value)) {
    return `+251${value.slice(1)}`;
  }

  if (/^9\d{8}$/.test(value) || /^7\d{8}$/.test(value)) {
    return `+251${value}`;
  }

  if (/^251(9|7)\d{8}$/.test(value)) {
    return `+${value}`;
  }

  if (/^\+251(9|7)\d{8}$/.test(value)) {
    return value;
  }

  if (/^\+1\d{10}$/.test(value)) {
    return value;
  }

  if (/^1\d{10}$/.test(value)) {
    return `+${value}`;
  }

  if (/^\d{10}$/.test(value)) {
    return `+1${value}`;
  }

  return value;
}

export function isValidUsPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return false;
  }
  return /^\+1[2-9]\d{2}[2-9]\d{6}$/.test(normalized);
}

export function isValidEthiopianPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return false;
  }
  return /^\+2519\d{8}$/.test(normalized) || /^\+2517\d{8}$/.test(normalized);
}

/** Login / PIN / OTP: US (default) or Ethiopian test accounts. */
export function isValidAccessPhone(phone: string): boolean {
  return isValidUsPhone(phone) || isValidEthiopianPhone(phone);
}

export function getUsAreaCode(phone: string): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized || !/^\+1\d{10}$/.test(normalized)) {
    return null;
  }
  return normalized.slice(2, 5);
}

export function isInDeliveryArea(phone: string): boolean {
  const areaCode = getUsAreaCode(phone);
  return Boolean(areaCode && DELIVERY_AREA_CODES.has(areaCode));
}

/** Address / checkout phones: valid US number in a served area. */
export function isValidDeliveryPhone(phone: string): boolean {
  return isValidUsPhone(phone) && isInDeliveryArea(phone);
}

/** `tel:` href for a normalized or raw phone. */
export function phoneTelHref(phone: string): string {
  const normalized = normalizePhone(phone) || phone.trim();
  return `tel:${normalized}`;
}

/** Telegram deep link by phone (digits without leading +). */
export function phoneTelegramHref(phone: string): string | null {
  const normalized = normalizePhone(phone) || phone.trim();
  const digits = normalized.replace(/^\+/, "").replace(/\D/g, "");
  if (!digits) {
    return null;
  }
  return `https://t.me/+${digits}`;
}
