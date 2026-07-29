import { describe, expect, it } from "vitest";

import { pinConfirmSchema, pinSchema } from "@/lib/auth/pin";

describe("pinSchema", () => {
  it("accepts 4-6 digit PINs", () => {
    expect(pinSchema.parse("1234")).toBe("1234");
    expect(pinSchema.parse("123456")).toBe("123456");
  });

  it("rejects non-numeric or wrong length", () => {
    expect(pinSchema.safeParse("123").success).toBe(false);
    expect(pinSchema.safeParse("1234567").success).toBe(false);
    expect(pinSchema.safeParse("12ab").success).toBe(false);
  });
});

describe("pinConfirmSchema", () => {
  it("requires matching PINs", () => {
    expect(
      pinConfirmSchema.safeParse({ pin: "1234", confirmPin: "1234" }).success,
    ).toBe(true);
    expect(
      pinConfirmSchema.safeParse({ pin: "1234", confirmPin: "9999" }).success,
    ).toBe(false);
  });
});
