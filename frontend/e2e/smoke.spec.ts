import { expect, test } from "@playwright/test";

import { passAgeGate } from "./helpers";

test.describe("public smoke", () => {
  test("age gate → homepage → products", async ({ page }) => {
    await passAgeGate(page);
    await page.goto("/");
    await expect(page.getByRole("heading").first()).toBeVisible();

    await page.goto("/products");
    await expect(page.getByRole("heading", { name: /products/i })).toBeVisible();
  });

  test("robots.txt blocks private routes", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Disallow: /account");
    expect(body).toContain("Disallow: /login");
    expect(body).toContain("Sitemap:");
  });

  test("sitemap.xml lists public routes", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toMatch(/\/products/);
  });
});
