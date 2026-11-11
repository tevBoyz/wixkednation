const deliveryZipData = require("../data/delivery-zip-codes.json");

const DELIVERY_ZIP_MESSAGE =
  "This ZIP code is outside our delivery area. We currently deliver in Northern Virginia, Washington DC, and South Maryland.";

const ALLOWED_ZIP_CODES = new Set(deliveryZipData.zipCodes);

function normalizeZip(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const digits = String(value).trim().replace(/\D/g, "");
  if (digits.length < 5) {
    return null;
  }

  return digits.slice(0, 5);
}

function isAllowedDeliveryZip(value) {
  const zip = normalizeZip(value);
  return Boolean(zip && ALLOWED_ZIP_CODES.has(zip));
}

function assertDeliveryZip(value, createError) {
  const throwError =
    typeof createError === "function"
      ? createError
      : (message, statusCode) => {
          const error = new Error(message);
          error.statusCode = statusCode;
          return error;
        };

  if (value === undefined || value === null || String(value).trim() === "") {
    throw throwError("postalCode is required.", 400);
  }

  const zip = normalizeZip(value);
  if (!zip) {
    throw throwError("postalCode must be a valid 5-digit US ZIP code.", 400);
  }

  if (!ALLOWED_ZIP_CODES.has(zip)) {
    throw throwError(DELIVERY_ZIP_MESSAGE, 400);
  }

  return zip;
}

module.exports = {
  ALLOWED_ZIP_CODES,
  DELIVERY_ZIP_MESSAGE,
  assertDeliveryZip,
  isAllowedDeliveryZip,
  normalizeZip,
};
