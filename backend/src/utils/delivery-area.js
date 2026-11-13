const deliveryZipData = require("../data/delivery-zip-codes.json");

const DELIVERY_ZIP_MESSAGE =
  "This ZIP code is outside our delivery area. We currently deliver throughout Ohio.";

const ZIP_MIN = Number(deliveryZipData.zipMin);
const ZIP_MAX = Number(deliveryZipData.zipMax);

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
  if (!zip) {
    return false;
  }

  const numeric = Number(zip);
  return numeric >= ZIP_MIN && numeric <= ZIP_MAX;
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

  if (!isAllowedDeliveryZip(zip)) {
    throw throwError(DELIVERY_ZIP_MESSAGE, 400);
  }

  return zip;
}

module.exports = {
  DELIVERY_ZIP_MESSAGE,
  assertDeliveryZip,
  isAllowedDeliveryZip,
  normalizeZip,
};
