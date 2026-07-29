import { type Page } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

/** Proxy only checks cookie presence - set a local E2E token. */
export async function passAgeGate(page: Page) {
  const origin = new URL(baseURL);
  await page.context().addCookies([
    {
      name: "age_gate_token",
      value: "e2e-age-gate-token",
      domain: origin.hostname,
      path: "/",
    },
  ]);
}
