import { expect, test } from "@playwright/test";

import { passAgeGate } from "./helpers";

/**
 * Optional PIN login flow.
 * Requires:
 * - Backend running with PIN auth
 * - E2E_PHONE (or E2E_EMAIL) + E2E_PIN for an existing account
 *
 * Skipped automatically when E2E_PIN is not set.
 */
const phone = process.env.E2E_PHONE || "+251911000000";
const email = process.env.E2E_EMAIL;
const pin = process.env.E2E_PIN;

test.describe("PIN login (optional)", () => {
  test.skip(!pin, "Set E2E_PIN (and E2E_PHONE or E2E_EMAIL) to run PIN login E2E");

  test("signs in with PIN", async ({ page }) => {
    await passAgeGate(page);
    await page.goto("/login");

    if (email) {
      await page.getByRole("button", { name: /^email$/i }).click();
      await page.getByLabel(/^email$/i).fill(email);
    } else {
      await page.getByLabel(/phone/i).fill(phone);
    }

    await page.getByLabel(/^pin$/i).fill(pin!);
    await page.getByRole("button", { name: /log in/i }).click();

    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 20_000,
    });
    await expect(page).not.toHaveURL(/\/login$/);
  });
});

/**
 * Optional register OTP → setup PIN flow.
 * Requires SMS_PROVIDER=mock and E2E_OTP from backend console after send.
 */
const otp = process.env.E2E_OTP;

test.describe("Register OTP (optional)", () => {
  test.skip(
    !otp,
    "Set E2E_OTP (and optionally E2E_PHONE) to run register OTP E2E",
  );

  test("starts register with phone OTP", async ({ page }) => {
    await passAgeGate(page);
    await page.goto("/register");
    await page.getByLabel(/phone/i).fill(phone);
    await page.getByRole("button", { name: /send code/i }).click();

    await page.waitForURL(/verify-otp/i, { timeout: 20_000 });
    await page.getByLabel(/code|otp/i).fill(otp!);
    await page.getByRole("button", { name: /verify/i }).first().click();

    await page.waitForURL(/setup-pin|\/(?!verify-otp)/i, { timeout: 20_000 });
  });
});
