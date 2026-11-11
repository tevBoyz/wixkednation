import { describe, expect, it } from "vitest";

import {
  mergeGuestLine,
  parseGuestCart,
  type GuestCartLine,
} from "@/lib/cart/guest-cart";
import {
  computeCartItemCount,
  computeCartSubtotal,
  computeLineTotal,
  toCartAmount,
} from "@/lib/cart/totals";

describe("toCartAmount / computeLineTotal", () => {
  it("parses numeric strings and ignores invalid values", () => {
    expect(toCartAmount("12.5")).toBe(12.5);
    expect(toCartAmount("nope")).toBe(0);
    expect(toCartAmount(null)).toBe(0);
  });

  it("computes line totals from price × quantity", () => {
    expect(computeLineTotal(10, 3)).toBe(30);
    expect(computeLineTotal("4.5", 2)).toBe(9);
    expect(computeLineTotal(10, 1.9)).toBe(10);
  });
});

describe("computeCartSubtotal / computeCartItemCount", () => {
  it("sums line totals and quantities", () => {
    const lines = [
      { lineTotal: 10, quantity: 1 },
      { lineTotal: 20, quantity: 2 },
    ];
    expect(computeCartSubtotal(lines)).toBe(30);
    expect(computeCartItemCount(lines)).toBe(3);
  });
});

describe("parseGuestCart", () => {
  it("returns [] for empty or corrupt JSON", () => {
    expect(parseGuestCart(null)).toEqual([]);
    expect(parseGuestCart("{not-json")).toEqual([]);
    expect(parseGuestCart("[]")).toEqual([]);
  });

  it("drops lines missing skuId", () => {
    const raw = JSON.stringify([
      {
        productId: "p1",
        name: "Legacy",
        image: null,
        quantity: 1,
        volume: 1,
        measurementUnit: "g",
        price: "40",
      },
    ]);
    expect(parseGuestCart(raw)).toEqual([]);
  });

  it("parses a valid guest cart array", () => {
    const raw = JSON.stringify([
      {
        productId: "p1",
        skuId: "sku-1",
        name: "Blue Dream",
        image: null,
        quantity: 2,
        volume: 1,
        measurementUnit: "g",
        price: "100",
        skuLabel: "1 g",
        slug: "blue-dream",
      },
    ]);
    expect(parseGuestCart(raw)).toEqual([
      {
        productId: "p1",
        skuId: "sku-1",
        name: "Blue Dream",
        image: null,
        quantity: 2,
        volume: 1,
        measurementUnit: "g",
        price: "100",
        skuLabel: "1 g",
        slug: "blue-dream",
      },
    ]);
  });
});

describe("mergeGuestLine", () => {
  const base: GuestCartLine = {
    productId: "p1",
    skuId: "sku-1g",
    name: "Blue Dream",
    image: null,
    quantity: 1,
    volume: 1,
    measurementUnit: "g",
    price: 100,
    skuLabel: "1 g",
    slug: "blue-dream",
  };

  it("appends a different SKU as a new line", () => {
    const next = mergeGuestLine([base], {
      productId: "p1",
      skuId: "sku-half",
      name: "Blue Dream",
      image: null,
      volume: 0.5,
      measurementUnit: "g",
      price: 60,
      skuLabel: "0.5 g",
    });
    expect(next).toHaveLength(2);
    expect(next[1]?.skuId).toBe("sku-half");
    expect(next[1]?.quantity).toBe(1);
  });

  it("increments quantity for the same SKU", () => {
    const next = mergeGuestLine([base], {
      productId: "p1",
      skuId: "sku-1g",
      name: "Blue Dream",
      image: null,
      volume: 1,
      measurementUnit: "g",
      price: 100,
      quantity: 2,
    });
    expect(next).toHaveLength(1);
    expect(next[0]?.quantity).toBe(3);
  });
});
