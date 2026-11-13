import { describe, expect, it } from "vitest";

import {
  isAllowedDeliveryZip,
  normalizeZip,
} from "@/lib/delivery/zip-codes";

describe("normalizeZip", () => {
  it("extracts the first 5 digits", () => {
    expect(normalizeZip("43215")).toBe("43215");
    expect(normalizeZip("43215-1234")).toBe("43215");
    expect(normalizeZip("")).toBe(null);
    expect(normalizeZip("123")).toBe(null);
  });
});

describe("isAllowedDeliveryZip", () => {
  it("accepts in-area ZIPs", () => {
    expect(isAllowedDeliveryZip("43215")).toBe(true);
    expect(isAllowedDeliveryZip("44114")).toBe(true);
    expect(isAllowedDeliveryZip("43001")).toBe(true);
    expect(isAllowedDeliveryZip("45999")).toBe(true);
  });

  it("rejects out-of-area ZIPs", () => {
    expect(isAllowedDeliveryZip("90210")).toBe(false);
    expect(isAllowedDeliveryZip("22201")).toBe(false);
    expect(isAllowedDeliveryZip("20001")).toBe(false);
  });
});
