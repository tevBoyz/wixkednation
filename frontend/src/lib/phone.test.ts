import { describe, expect, it } from "vitest";

import {
  isValidEthiopianPhone,
  normalizePhone,
} from "@/lib/phone";

describe("normalizePhone", () => {
  it("normalizes local 09… numbers to +2519…", () => {
    expect(normalizePhone("0911676343")).toBe("+251911676343");
  });

  it("normalizes local 07… numbers to +2517…", () => {
    expect(normalizePhone("0711223344")).toBe("+251711223344");
  });

  it("adds + to bare 251… numbers", () => {
    expect(normalizePhone("251911676343")).toBe("+251911676343");
  });

  it("strips spaces", () => {
    expect(normalizePhone(" +251 911 676 343 ")).toBe("+251911676343");
  });

  it("returns empty for blank input", () => {
    expect(normalizePhone("")).toBe("");
  });
});

describe("isValidEthiopianPhone", () => {
  it("accepts valid ETB mobile numbers", () => {
    expect(isValidEthiopianPhone("+251911676343")).toBe(true);
    expect(isValidEthiopianPhone("0911676343")).toBe(true);
    expect(isValidEthiopianPhone("+251711223344")).toBe(true);
  });

  it("rejects invalid numbers", () => {
    expect(isValidEthiopianPhone("+251811223344")).toBe(false);
    expect(isValidEthiopianPhone("123")).toBe(false);
    expect(isValidEthiopianPhone("+15551234567")).toBe(false);
  });
});
