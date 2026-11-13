/**
 * Phone helpers for WixkedNation.
 *
 * Default customer/admin format: US E.164 (+1XXXXXXXXXX).
 * Ethiopian (+251…) remains valid for login/PIN access so existing test
 * accounts keep working. Delivery eligibility is checked by ZIP code.
 */

function normalizePhone(phone) {
  if (!phone || typeof phone !== "string") {
    return null;
  }

  let value = phone.trim().replace(/[\s().\-]/g, "");

  if (!value) {
    return null;
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

  // US local / national forms → +1XXXXXXXXXX
  if (/^\+1\d{10}$/.test(value)) {
    return value;
  }

  if (/^1\d{10}$/.test(value)) {
    return `+${value}`;
  }

  if (/^\d{10}$/.test(value)) {
    return `+1${value}`;
  }

  if (value.startsWith("+")) {
    return value;
  }

  return value;
}

function isValidUsPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return false;
  }

  // NANP: +1 + area (2–9xx) + exchange (2–9xx) + 4 digits
  return /^\+1[2-9]\d{2}[2-9]\d{6}$/.test(normalized);
}

function isValidEthiopianPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return false;
  }

  return (
    /^\+2519\d{8}$/.test(normalized) || /^\+2517\d{8}$/.test(normalized)
  );
}

/** Login / PIN / OTP access: US (default) or Ethiopian test accounts. */
function isValidAccessPhone(phone) {
  return isValidUsPhone(phone) || isValidEthiopianPhone(phone);
}

/** Customer-facing phone fields default to US only. */
function isValidCustomerPhone(phone) {
  return isValidUsPhone(phone);
}

/**
 * Requires a valid US phone number (any area code).
 * @returns {string} normalized E.164 phone
 */
function assertUsPhone(phone, createError) {
  const throwError =
    typeof createError === "function"
      ? createError
      : (message, statusCode) => {
          const error = new Error(message);
          error.statusCode = statusCode;
          return error;
        };

  const normalized = normalizePhone(phone);

  if (!normalized || !isValidUsPhone(normalized)) {
    throw throwError(
      "phone must be a valid US number (e.g. +17035551234 or 7035551234).",
      400
    );
  }

  return normalized;
}

/** @deprecated Use assertUsPhone — kept for internal migration compatibility. */
function assertDeliveryPhone(phone, createError) {
  return assertUsPhone(phone, createError);
}

module.exports = {
  assertDeliveryPhone,
  assertUsPhone,
  isValidAccessPhone,
  isValidCustomerPhone,
  isValidEthiopianPhone,
  isValidUsPhone,
  normalizePhone
};
