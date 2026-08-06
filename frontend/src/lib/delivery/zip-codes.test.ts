import { describe, expect, it } from "vitest";

import {
  isAllowedDeliveryZip,
  normalizeZip,
} from "@/lib/delivery/zip-codes";

describe("normalizeZip", () => {
  it("extracts the first 5 digits", () => {
    expect(normalizeZip("22201")).toBe("22201");
    expect(normalizeZip("22201-1234")).toBe("22201");
    expect(normalizeZip("")).toBe(null);
    expect(normalizeZip("123")).toBe(null);
  });
});

describe("isAllowedDeliveryZip", () => {
  it("accepts in-area ZIPs", () => {
    expect(isAllowedDeliveryZip("22201")).toBe(true);
    expect(isAllowedDeliveryZip("20001")).toBe(true);
  });

  it("rejects out-of-area ZIPs", () => {
    expect(isAllowedDeliveryZip("90210")).toBe(false);
  });
});
