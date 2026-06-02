/**
 * Multi-supplier split (the real new capability). One requisition (RFQ-MULTI,
 * two lines) awarded to two different suppliers produces TWO purchase orders.
 */
import { test, expect } from "@playwright/test";
import { resetStore, switchRole, waitForApp } from "./helpers";

test.beforeEach(async ({ page }) => { await resetStore(page); });

test("RFQ-MULTI shows per-line groups and the multi-line banner", async ({ page }) => {
  await switchRole(page, "buyer");
  await page.goto("/sourcing/rfq/RFQ-MULTI");
  await waitForApp(page);
  await expect(page.getByTestId("multi-line-banner")).toBeVisible();
  // two line comparison groups
  await expect(page.getByTestId("compare-line-TL-MULTI-1")).toBeVisible();
  await expect(page.getByTestId("compare-line-TL-MULTI-2")).toBeVisible();
});

test("awarding two lines to two suppliers creates two POs", async ({ page }) => {
  await switchRole(page, "buyer");
  await page.goto("/sourcing/rfq/RFQ-MULTI");
  await waitForApp(page);
  await page.waitForTimeout(400);

  // Line 1 lowest landed = SUP-0004 (12.5); Line 2 lowest landed = SUP-0006 (0.19).
  // Defaults are pre-selected to lowest-landed -> two distinct suppliers.
  await expect(page.getByTestId("pick-TL-MULTI-1-SUP-0004")).toBeVisible();
  await expect(page.getByTestId("pick-TL-MULTI-2-SUP-0006")).toBeVisible();
  // the banner should preview 2 suppliers -> 2 POs
  await expect(page.getByTestId("multi-line-banner")).toContainText(/2 suppliers/i);

  await page.getByTestId("award-submit").click();
  await expect(page.getByTestId("award-result")).toBeVisible({ timeout: 10_000 });
  // two PO links in the result
  const poLinks = page.locator('[data-testid^="go-po-"]');
  await expect(poLinks).toHaveCount(2);

  // navigate to the first resulting PO — it is a real draft PO
  await poLinks.first().click();
  await page.waitForURL(/\/purchase-orders\/[^/]+$/, { timeout: 10_000 });
  await expect(page.locator("h1")).toBeVisible();
});

test("awarding the same supplier for both lines yields ONE PO", async ({ page }) => {
  await switchRole(page, "buyer");
  await page.goto("/sourcing/rfq/RFQ-MULTI");
  await waitForApp(page);
  await page.waitForTimeout(400);
  // both lines have a SUP-0002 quote; pick it for both -> single supplier -> 1 PO
  await page.getByTestId("pick-TL-MULTI-1-SUP-0002").click();
  await page.getByTestId("pick-TL-MULTI-2-SUP-0002").click();
  // non-lowest-landed picks -> justification required
  await page.getByTestId("award-justification").fill("consolidate freight with one supplier");
  await page.getByTestId("award-submit").click();
  await expect(page.getByTestId("award-result")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-testid^="go-po-"]')).toHaveCount(1);
});
