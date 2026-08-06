/** Match backend `src/utils/phone.js` rules. */

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

/** Strip input to at most 10 US local digits. */
export function stripToUsLocalDigits(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("1") && digits.length === 11) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

/** Display/edit helper: +1XXXXXXXXXX → 10 local digits. */
export function usLocalFromE164(phone: string): string {
  const normalized = normalizePhone(phone);
  if (/^\+1\d{10}$/.test(normalized)) {
    return normalized.slice(2);
  }

  return stripToUsLocalDigits(phone);
}

/** Form submit helper: 10 local digits → +1XXXXXXXXXX. */
export function toUsE164(localDigits: string): string {
  const digits = stripToUsLocalDigits(localDigits);
  if (digits.length !== 10) {
    return "";
  }

  return `+1${digits}`;
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
