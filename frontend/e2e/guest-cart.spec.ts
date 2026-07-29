import { expect, test } from "@playwright/test";

import { passAgeGate } from "./helpers";

test.describe("guest cart", () => {
  test("can open a product and add to cart as guest", async ({ page }) => {
    await passAgeGate(page);
    await page.goto("/products");

    const productLink = page.locator('a[href^="/products/"]').first();
    await expect(productLink).toBeVisible({ timeout: 20_000 });
    await productLink.click();

    const addButton = page.getByRole("button", { name: /add to cart/i });
    await expect(addButton).toBeVisible({ timeout: 15_000 });
    await addButton.click();

    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /cart/i })).toBeVisible();
    await expect(page.getByText(/cart is empty|no items/i)).toHaveCount(0);
  });
});
