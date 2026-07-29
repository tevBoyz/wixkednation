/** Match backend `src/utils/phone.js` rules. */

export function normalizePhone(phone: string): string {
  if (!phone || typeof phone !== "string") {
    return "";
  }

  let value = phone.trim().replace(/\s+/g, "");

  // Common local forms → E.164 Ethiopia
  if (/^09\d{8}$/.test(value)) {
    value = `+251${value.slice(1)}`;
  } else if (/^07\d{8}$/.test(value)) {
    value = `+251${value.slice(1)}`;
  } else if (/^9\d{8}$/.test(value)) {
    value = `+251${value}`;
  } else if (/^7\d{8}$/.test(value)) {
    value = `+251${value}`;
  } else if (/^251(9|7)\d{8}$/.test(value)) {
    value = `+${value}`;
  }

  return value;
}

export function isValidEthiopianPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return false;
  }
  return /^\+2519\d{8}$/.test(normalized) || /^\+2517\d{8}$/.test(normalized);
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
