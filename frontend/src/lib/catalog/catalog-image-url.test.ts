import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveCatalogAssetUrl } from "@/lib/catalog/catalog-image-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveCatalogAssetUrl", () => {
  it("rebases API asset URLs onto the configured API origin", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");

    expect(
      resolveCatalogAssetUrl(
        "http://localhost:5000/api/assets/product-images/p1/i1.webp",
      ),
    ).toBe("https://api.example.com/api/assets/product-images/p1/i1.webp");
  });

  it("prefixes relative asset paths and keeps matching URLs unchanged", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com/");

    expect(resolveCatalogAssetUrl("/api/assets/default-product.webp")).toBe(
      "https://api.example.com/api/assets/default-product.webp",
    );
    expect(
      resolveCatalogAssetUrl("https://api.example.com/api/assets/x.webp"),
    ).toBe("https://api.example.com/api/assets/x.webp");
  });

  it("leaves non-asset sources alone", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");

    const supabase =
      "https://project.supabase.co/storage/v1/object/public/bucket/x.webp";
    expect(resolveCatalogAssetUrl(supabase)).toBe(supabase);
    expect(resolveCatalogAssetUrl("/brand/logo.png")).toBe("/brand/logo.png");
  });

  it("returns null for blank input", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");

    expect(resolveCatalogAssetUrl("   ")).toBeNull();
    expect(resolveCatalogAssetUrl(null)).toBeNull();
    expect(resolveCatalogAssetUrl(undefined)).toBeNull();
  });

  it("passes URLs through when the API URL is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    expect(
      resolveCatalogAssetUrl("http://localhost:5000/api/assets/x.webp"),
    ).toBe("http://localhost:5000/api/assets/x.webp");
  });
});
