import { describe, expect, it } from "vitest";

import {
  isInDeliveryArea,
  isValidAccessPhone,
  isValidDeliveryPhone,
  isValidEthiopianPhone,
  isValidUsPhone,
  normalizePhone,
} from "@/lib/phone";

describe("normalizePhone", () => {
  it("normalizes US 10-digit and formatted numbers to +1…", () => {
    expect(normalizePhone("7035551234")).toBe("+17035551234");
    expect(normalizePhone("(703) 555-1234")).toBe("+17035551234");
    expect(normalizePhone("1-703-555-1234")).toBe("+17035551234");
    expect(normalizePhone("+1 703 555 1234")).toBe("+17035551234");
  });

  it("still normalizes Ethiopian local forms for test access", () => {
    expect(normalizePhone("0911676343")).toBe("+251911676343");
    expect(normalizePhone("0711223344")).toBe("+251711223344");
    expect(normalizePhone("251911676343")).toBe("+251911676343");
  });

  it("returns empty for blank input", () => {
    expect(normalizePhone("")).toBe("");
  });
});

describe("isValidUsPhone / access / delivery", () => {
  it("accepts valid US numbers", () => {
    expect(isValidUsPhone("+17035551234")).toBe(true);
    expect(isValidUsPhone("7035551234")).toBe(true);
    expect(isValidAccessPhone("+14696571013")).toBe(true);
  });

  it("keeps Ethiopian numbers for access only", () => {
    expect(isValidEthiopianPhone("+251911676343")).toBe(true);
    expect(isValidAccessPhone("0911676343")).toBe(true);
    expect(isValidUsPhone("+251911676343")).toBe(false);
    expect(isValidDeliveryPhone("+251911676343")).toBe(false);
  });

  it("enforces delivery area codes (NoVA, DC, South MD)", () => {
    expect(isInDeliveryArea("+17035551234")).toBe(true);
    expect(isInDeliveryArea("+15715551234")).toBe(true);
    expect(isInDeliveryArea("+12025551234")).toBe(true);
    expect(isInDeliveryArea("+13015551234")).toBe(true);
    expect(isValidDeliveryPhone("+17035551234")).toBe(true);
    expect(isInDeliveryArea("+14696571013")).toBe(false);
    expect(isValidDeliveryPhone("+14696571013")).toBe(false);
  });
});
