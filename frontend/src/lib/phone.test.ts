import { describe, expect, it } from "vitest";

import {
  isValidAccessPhone,
  isValidEthiopianPhone,
  isValidUsPhone,
  normalizePhone,
  stripToUsLocalDigits,
  toUsE164,
  usLocalFromE164,
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

describe("US local digit helpers", () => {
  it("strips formatting to 10 digits", () => {
    expect(stripToUsLocalDigits("(703) 555-1234")).toBe("7035551234");
    expect(stripToUsLocalDigits("+17035551234")).toBe("7035551234");
  });

  it("converts between local digits and E.164", () => {
    expect(toUsE164("7035551234")).toBe("+17035551234");
    expect(usLocalFromE164("+17035551234")).toBe("7035551234");
  });
});

describe("isValidUsPhone / access", () => {
  it("accepts valid US numbers from any area code", () => {
    expect(isValidUsPhone("+17035551234")).toBe(true);
    expect(isValidUsPhone("7035551234")).toBe(true);
    expect(isValidUsPhone("+14696571013")).toBe(true);
    expect(isValidAccessPhone("+14696571013")).toBe(true);
  });

  it("keeps Ethiopian numbers for access only", () => {
    expect(isValidEthiopianPhone("+251911676343")).toBe(true);
    expect(isValidAccessPhone("0911676343")).toBe(true);
    expect(isValidUsPhone("+251911676343")).toBe(false);
  });
});
