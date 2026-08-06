import deliveryZipData from "@/data/delivery-zip-codes.json";
import { z } from "zod";

export const DELIVERY_ZIP_MESSAGE =
  "This ZIP code is outside our delivery area. We currently deliver in Northern Virginia, Washington DC, and South Maryland.";

export const ALLOWED_ZIP_CODES = new Set<string>(deliveryZipData.zipCodes);

export function normalizeZip(value?: string | number | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const digits = String(value).trim().replace(/\D/g, "");
  if (digits.length < 5) {
    return null;
  }

  return digits.slice(0, 5);
}

export function isAllowedDeliveryZip(value?: string | number | null): boolean {
  const zip = normalizeZip(value);
  return Boolean(zip && ALLOWED_ZIP_CODES.has(zip));
}

export function zipCodeSchema(options?: { required?: boolean }) {
  const required = options?.required ?? true;

  let schema = z.string().trim();

  if (required) {
    schema = schema.min(1, "ZIP code is required");
  }

  return schema.refine(
    (value) => !value.trim() || isAllowedDeliveryZip(value),
    { message: DELIVERY_ZIP_MESSAGE },
  );
}
