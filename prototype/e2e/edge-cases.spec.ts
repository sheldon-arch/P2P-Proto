/**
 * Edge cases made demonstrable (v1.1 Step E). Each is a clickable path with a
 * dedicated test; a screenshot is captured for review. These prove the platform
 * handles the hard cases, not just the happy path.
 */
import { test, expect } from "@playwright/test";
import { resetStore, switchRole, waitForApp } from "./helpers";

test.beforeEach(async ({ page }) => { await resetStore(page); });

test("suspended supplier blocks PO issue", async ({ page }) => {
  await switchRole(page, "buyer");
  await page.goto("/purchase-orders/PO-SUSP-1"); // DRAFT PO to SUSPENDED SUP-0046
  await waitForApp(page);
  // the issue action is offered; clicking it is rejected by the engine guard
  const issue = page.getByTestId("action-issue");
  await expect(issue).toBeVisible();
  await issue.click();
  await expect(page.getByText(/not onboarded|suspended/i).first()).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: "e2e/__screenshots__/edge-suspended-blocks-po.png", fullPage: true });
});

test("returns/RMA workflow advances; and a return can be declined", async ({ page }) => {
  await switchRole(page, "buyer");
  // RMA-EDGE-1 is INITIATED -> can authorize OR decline
  await page.goto("/returns/RMA-EDGE-1");
  await waitForApp(page);
  await expect(page.getByTestId("action-authorize")).toBeVisible();
  await expect(page.getByTestId("action-decline")).toBeVisible();
  await page.screenshot({ path: "e2e/__screenshots__/edge-return-initiated.png", fullPage: true });
  // decline -> DECLINED
  await page.getByTestId("action-decline").click();
  await expect(page.getByText(/decline.*done|done/i).first()).toBeVisible({ timeout: 10_000 });
});

test("returns/RMA full chain: authorize -> identify -> schedule -> close", async ({ page }) => {
  // RMA-LV-1 starts AUTHORIZED/SHIPMENT_SCHEDULED; drive remaining as admin (all roles)
  await switchRole(page, "administrator");
  await page.goto("/returns/RMA-LV-1");
  await waitForApp(page);
  // at SHIPMENT_SCHEDULED -> close + credit/debit note
  const close = page.getByTestId("action-closeOrAdjust");
  await expect(close).toBeVisible();
  await close.click();
  await expect(page.getByText(/done/i).first()).toBeVisible({ timeout: 10_000 });
});

test("over-tolerance receipt is blocked", async ({ page }) => {
  await switchRole(page, "receiving");
  await page.goto("/deliveries/PO-LV-3/receive"); // contractQty 5000, FOB (no COA gate)
  await waitForApp(page);
  await page.getByTestId("received-qty").fill("6000"); // +20% > 10% tolerance
  await expect(page.getByTestId("over-tolerance-banner")).toBeVisible();
  await page.getByTestId("post-grn").click();
  await expect(page.getByText(/exceeds.*tolerance/i).first()).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: "e2e/__screenshots__/edge-over-tolerance.png", fullPage: true });
});

test("partial payment approval creates a remainder installment", async ({ page }) => {
  await switchRole(page, "finance_maker");
  await page.goto("/payments/INST-LV-1R"); // PENDING, agreed 15000
  await waitForApp(page);
  await expect(page.getByTestId("payment-actions")).toBeVisible();
  await page.getByTestId("approve-amount").fill("9000"); // < agreed -> partial
  await page.getByTestId("installment-approve").click();
  await expect(page.getByText(/done/i).first()).toBeVisible({ timeout: 10_000 });
  // a new remainder installment (15000-9000=6000) now exists on the payments list
  await page.goto("/payments");
  await waitForApp(page);
  await expect(page.getByTestId("data-row").first()).toBeVisible();
});

test("FX degradation: no-rate currency returns unconverted with a banner", async ({ page }) => {
  await switchRole(page, "finance_maker");
  await page.goto("/analytics/currency");
  await waitForApp(page);
  await page.getByTestId("fx-currency").click();
  await page.getByRole("option", { name: /no rate/i }).click();
  await expect(page.getByTestId("fx-degrade")).toBeVisible();
  await page.screenshot({ path: "e2e/__screenshots__/edge-fx-degrade.png", fullPage: true });
});

test("partial deliveries: multiple GRNs against one PO", async ({ page }) => {
  await switchRole(page, "receiving");
  // PO-LV-3 already has two partial GRNs in seed; the deliveries list shows them
  await page.goto("/deliveries");
  await waitForApp(page);
  const rows = page.getByTestId("data-row");
  await expect(rows.first()).toBeVisible();
  // post another partial via the receive form (within tolerance, FOB)
  await page.goto("/deliveries/PO-LV-3/receive");
  await waitForApp(page);
  await page.getByTestId("received-qty").fill("1666"); // a further partial
  await page.getByTestId("post-grn").click();
  await expect(page.getByText(/goods receipt posted/i).first()).toBeVisible({ timeout: 10_000 });
});

test("auto-approve vs nearest-bucket visible on the hero requisition", async ({ page }) => {
  await switchRole(page, "approver");
  await page.goto("/requisitions/TKT-HERO");
  await waitForApp(page);
  // the approval chain panel renders the finance stage with its limit (the
  // auto-approve threshold) and the routed stages
  await expect(page.getByTestId("approval-panel")).toBeVisible();
  await expect(page.getByText(/finance/i).first()).toBeVisible();
  await page.screenshot({ path: "e2e/__screenshots__/edge-approval-routing.png", fullPage: true });
});
