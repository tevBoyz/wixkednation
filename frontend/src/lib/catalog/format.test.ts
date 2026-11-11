import { describe, expect, it } from "vitest";

import {
  DEFAULT_CURRENCY,
  normalizeStoreCurrency,
} from "@/lib/catalog/currency";
import {
  formatCannabinoidLine,
  formatPackPrice,
  formatPrice,
  formatProductPrice,
  formatSkuLabel,
  formatVolumeUnit,
  hasProductPrice,
  hasSellablePack,
  resolveEffectiveVolume,
  resolveProductSkus,
} from "@/lib/catalog/format";

describe("normalizeStoreCurrency", () => {
  it("defaults to USD and uppercases known codes", () => {
    expect(normalizeStoreCurrency(undefined)).toBe(DEFAULT_CURRENCY);
    expect(normalizeStoreCurrency("usd")).toBe("USD");
    expect(normalizeStoreCurrency("XYZ")).toBe("USD");
  });
});

describe("formatPrice", () => {
  it("formats amounts for the store currency", () => {
    expect(formatPrice(100, "ETB")).toMatch(/100/);
    expect(formatPrice(12.5, "USD")).toMatch(/12\.50|12\.5/);
  });

  it("returns an em dash for invalid amounts", () => {
    expect(formatPrice("nope")).toBe("-");
    expect(formatPrice(null)).toBe("-");
  });
});

describe("formatProductPrice", () => {
  it("shows contact CTA when price is unset", () => {
    expect(formatProductPrice(null)).toBe("Contact for price");
  });

  it("formats set prices normally", () => {
    expect(formatProductPrice(50, "ETB")).toMatch(/50/);
  });
});

describe("formatPackPrice", () => {
  it("formats pack as price / volume unit", () => {
    expect(
      formatPackPrice(
        { price: 2800, volume: 1, measurementUnit: "g" },
        "ETB",
      ),
    ).toMatch(/2[,.]?800.*\/.*1 g/);
  });

  it("shows contact CTA when pack incomplete", () => {
    expect(
      formatPackPrice({ price: 2800, volume: null, measurementUnit: "g" }),
    ).toBe("Contact for price");
  });

  it("prefixes with from when multiple SKUs", () => {
    expect(
      formatPackPrice(
        {
          price: 100,
          volume: 1,
          measurementUnit: "g",
          skus: [
            {
              id: "a",
              price: 100,
              volume: 1,
              measurementUnit: "g",
              sortOrder: 0,
              isVisible: true,
            },
            {
              id: "b",
              price: 60,
              volume: 0.5,
              measurementUnit: "g",
              sortOrder: 1,
              isVisible: true,
            },
          ],
        },
        "USD",
      ),
    ).toMatch(/^from /);
  });
});

describe("hasSellablePack", () => {
  it("requires price and volume > 0", () => {
    expect(hasSellablePack({ price: 100, volume: 1 })).toBe(true);
    expect(hasSellablePack({ price: 100, volume: 0 })).toBe(false);
    expect(hasSellablePack({ price: null, volume: null })).toBe(false);
  });

  it("treats any sellable SKU as sellable", () => {
    expect(
      hasSellablePack({
        price: null,
        volume: null,
        skus: [{ price: 60, volume: 0.5, isVisible: true }],
      }),
    ).toBe(true);
  });
});

describe("resolveEffectiveVolume", () => {
  it("prefers API effectiveVolume then computes volume × qty", () => {
    expect(resolveEffectiveVolume(1, 3, "3.00")).toBe("3.00");
    expect(resolveEffectiveVolume(1, 3)).toBe(3);
    expect(resolveEffectiveVolume(null, 2)).toBeNull();
  });
});

describe("hasProductPrice", () => {
  it("detects sellable prices", () => {
    expect(hasProductPrice(0)).toBe(true);
    expect(hasProductPrice("12.5")).toBe(true);
    expect(hasProductPrice(null)).toBe(false);
  });
});

describe("formatCannabinoidLine", () => {
  it("joins THC and CBD when present", () => {
    expect(
      formatCannabinoidLine({ thcPercent: 22, cbdPercent: "1.5" }),
    ).toBe("THC 22% · CBD 1.5%");
    expect(
      formatCannabinoidLine({ thcPercent: null, cbdPercent: null }),
    ).toBeNull();
  });
});

describe("formatVolumeUnit", () => {
  it("combines volume and unit when both present", () => {
    expect(formatVolumeUnit(1, "kg")).toBe("1 kg");
    expect(formatVolumeUnit(null, "pcs")).toBe("pcs");
    expect(formatVolumeUnit(2, null)).toBeNull();
  });
});

describe("formatSkuLabel", () => {
  it("prefers custom label then volume unit", () => {
    expect(
      formatSkuLabel({ label: "Eighth", volume: 3.5, measurementUnit: "g" }),
    ).toBe("Eighth");
    expect(formatSkuLabel({ label: null, volume: 1, measurementUnit: "g" })).toBe(
      "1 g",
    );
  });
});

describe("resolveProductSkus", () => {
  it("returns visible sellable SKUs sorted by sortOrder", () => {
    expect(
      resolveProductSkus({
        skus: [
          {
            id: "b",
            volume: 1,
            measurementUnit: "g",
            price: 100,
            sortOrder: 1,
          },
          {
            id: "a",
            volume: 0.5,
            measurementUnit: "g",
            price: 60,
            sortOrder: 0,
          },
          {
            id: "hidden",
            volume: 2,
            measurementUnit: "g",
            price: 180,
            sortOrder: 2,
            isVisible: false,
          },
        ],
      }).map((s) => s.id),
    ).toEqual(["a", "b"]);
  });
});
