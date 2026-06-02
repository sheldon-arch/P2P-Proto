/**
 * Screenshot harness. Captures every internal route to e2e/__screenshots__/ for
 * visual review (layout breakage, overflow, misalignment that behavioral
 * assertions miss). Run with: pnpm exec playwright test screenshots
 * Then review the folder / assemble a contact sheet.
 */
import { test } from "@playwright/test";
import { ALL_ROUTES, EXTRA_ROUTES, PORTAL_ROUTES, waitForApp } from "./helpers";

test.describe("capture every route (admin lens)", () => {
  for (const route of [...ALL_ROUTES, ...EXTRA_ROUTES]) {
    test(`screenshot ${route}`, async ({ page }) => {
      await page.goto(route);
      await waitForApp(page);
      await page.waitForTimeout(400); // let tables settle
      const name = route.replace(/\//g, "_").replace(/^_/, "") || "home";
      await page.screenshot({ path: `e2e/__screenshots__/${name}.png`, fullPage: true });
    });
  }
  for (const route of PORTAL_ROUTES) {
    test(`screenshot ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(500);
      const name = route.replace(/\//g, "_").replace(/^_/, "");
      await page.screenshot({ path: `e2e/__screenshots__/${name}.png`, fullPage: true });
    });
  }
});
