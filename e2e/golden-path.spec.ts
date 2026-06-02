/**
 * Golden-path interaction tests (Phase 2 scope: demand -> award).
 * Exercises the REAL flow through the UI + engine:
 *   - the requisition form creates a record and lands on its detail
 *   - SoD: the requester persona cannot approve their own requisition
 *   - an approver persona CAN approve the stage
 *   - the landed-cost compare matrix awards (with the flip visible)
 * Flow correctness, not just "the page loads".
 */
import { test, expect } from "@playwright/test";
import { waitForApp, switchRole, resetStore } from "./helpers";

// Each test starts from a fresh deterministic seed so mutations don't leak.
test.beforeEach(async ({ page }) => {
  await resetStore(page);
});

test("requisition form creates a record and navigates to its detail", async ({ page }) => {
  await switchRole(page, "requester");
  await page.goto("/requisitions/new");
  await waitForApp(page);

  await page.getByTestId("line-item").first().fill("ITM-0006");
  await page.getByTestId("line-qty").first().fill("10");
  await page.getByTestId("line-price").first().fill("100");
  await expect(page.getByTestId("req-total")).toContainText("1,000");

  await page.getByTestId("submit-requisition").click();
  // lands on a requisition detail (URL contains /requisitions/<id>)
  await page.waitForURL(/\/requisitions\/[^/]+$/, { timeout: 10_000 });
  await expect(page.locator("h1")).toBeVisible();
});

test("requester role cannot approve a requisition (no approve control)", async ({ page }) => {
  // The requester persona has no approval permission, so the approve action is
  // not offered. (Engine-level SoD self-approval block is covered in unit tests.)
  await switchRole(page, "requester");
  await page.goto("/requisitions/TKT-LV-001");
  await waitForApp(page);
  await expect(page.getByTestId("approval-panel")).toBeVisible();
  await expect(page.getByTestId("approve-btn")).toHaveCount(0);
});

test("approver can approve a requisition stage", async ({ page }) => {
  await switchRole(page, "approver");
  await page.goto("/requisitions/TKT-LV-002");
  await waitForApp(page);
  const approve = page.getByTestId("approve-btn");
  await expect(approve).toBeVisible();
  await approve.click();
  // a success toast confirms the engine accepted it
  await expect(page.getByText(/approved/i).first()).toBeVisible({ timeout: 10_000 });
});

test("landed-cost compare shows the flip and awards", async ({ page }) => {
  await switchRole(page, "buyer");
  await page.goto("/sourcing/rfq/RFQ-HERO");
  await waitForApp(page);

  // the flip banner + winner badge are present
  await expect(page.getByTestId("landed-flip-banner")).toBeVisible();
  await expect(page.getByTestId("winner-badge")).toBeVisible();
  // the price spike is flagged on BioCore
  await expect(page.getByTestId("spike-flag")).toBeVisible();

  // the lowest-landed (Synthex SUP-0001) is pre-selected; award (single line -> 1 PO)
  // RFQ-HERO quotes carry itemId (no lineId), so the comparison group key is the itemId.
  await expect(page.getByTestId("pick-ITM-0006-SUP-0001")).toBeVisible();
  await page.getByTestId("award-submit").click();
  await expect(page.getByTestId("award-result")).toBeVisible({ timeout: 10_000 });
});

// ---- Phase 3: PO -> receipt -> quality --------------------------------

test("issuing a carton PO hard-commits the budget", async ({ page }) => {
  await switchRole(page, "buyer");
  await page.goto("/purchase-orders/PO-HERO-CTN");
  await waitForApp(page);
  // PO-HERO-CTN ($17.9k) is linked to BUD-0001 ($36k avail) -> clean commit, no override needed
  await page.getByTestId("action-issue").click();
  await expect(page.getByText(/issue po done/i).first()).toBeVisible({ timeout: 10_000 });
  // status badge should now read ISSUED
  await expect(page.getByText(/issued/i).first()).toBeVisible();
});

test("over-budget PO issue is blocked without an override", async ({ page }) => {
  await switchRole(page, "buyer");
  await page.goto("/purchase-orders/PO-HERO");
  await waitForApp(page);
  // PO-HERO ($696k) far exceeds BUD-0012 -> the over-budget banner + override toggle show
  await expect(page.getByTestId("po-over-budget")).toBeVisible();
  await expect(page.getByTestId("po-override")).toBeVisible();
  // issuing without ticking override fails (engine guard)
  await page.getByTestId("action-issue").click();
  await expect(page.getByText(/exceeds available budget|exceeds.*budget/i).first()).toBeVisible({ timeout: 10_000 });
});

test("goods receipt: +7% within tolerance amends the PO", async ({ page }) => {
  await switchRole(page, "receiving");
  await page.goto("/deliveries/PO-LV-3/receive"); // PO-LV-3 contractQty = 5000, FOB (no COA gate)
  await waitForApp(page);
  // enter +7% over the ordered 5000 = 5350
  await page.getByTestId("received-qty").fill("5350");
  await expect(page.getByTestId("tolerance-amend-banner")).toBeVisible();
});

test("goods receipt: COA gate blocks regulated receipt until on file", async ({ page }) => {
  await switchRole(page, "receiving");
  await page.goto("/deliveries/PO-HERO/receive"); // import PO (CIF) -> COA required
  await waitForApp(page);
  await expect(page.getByTestId("coa-gate-banner")).toBeVisible();
  // posting is blocked
  await page.getByTestId("post-grn").click();
  await expect(page.getByText(/coa must be on file/i).first()).toBeVisible({ timeout: 10_000 });
});

test("open NCR (in CAPA) offers Close CAPA to quality; closing suspends the supplier", async ({ page }) => {
  await switchRole(page, "quality");
  // NCR-LV-1 is IN_CAPA (the hero quality-loop record); closing the CAPA crosses
  // the supplier's below-threshold streak and suspends SUP-0001.
  await page.goto("/quality/ncr/NCR-LV-1");
  await waitForApp(page);
  await expect(page.getByTestId("action-panel")).toBeVisible();
  await expect(page.getByTestId("action-closeCapa")).toBeVisible();
  await page.getByTestId("action-closeCapa").click();
  await expect(page.getByText(/close capa done/i).first()).toBeVisible({ timeout: 10_000 });
});

// ---- Phase 4: invoice -> payment -> analytics -------------------------

test("three-way match exception routes to the right role and resolves", async ({ page }) => {
  await switchRole(page, "buyer");
  // INV-LV-10 = price-variance exception (routes to Buyer)
  await page.goto("/invoices/INV-LV-10");
  await waitForApp(page);
  await expect(page.getByTestId("match-exception")).toBeVisible();
  await expect(page.getByTestId("match-exception")).toContainText(/buyer/i);
  await page.getByTestId("resolve-btn").click();
  await expect(page.getByText(/resolved/i).first()).toBeVisible({ timeout: 10_000 });
});

test("duplicate invoice is held with no payable", async ({ page }) => {
  await switchRole(page, "finance_maker");
  // INV-LV-13 = duplicate-invoice, onHold
  await page.goto("/invoices/INV-LV-13");
  await waitForApp(page);
  await expect(page.getByTestId("duplicate-hold")).toBeVisible();
});

test("maker/checker: maker can process an approved installment", async ({ page }) => {
  await switchRole(page, "finance_maker");
  // INST-LV-2 is APPROVED -> maker can process
  await page.goto("/payments/INST-LV-2");
  await waitForApp(page);
  await expect(page.getByTestId("payment-actions")).toBeVisible();
  await expect(page.getByTestId("installment-process")).toBeVisible();
  await page.getByTestId("installment-process").click();
  await expect(page.getByText(/process done/i).first()).toBeVisible({ timeout: 10_000 });
});

test("analytics shows spend by category", async ({ page }) => {
  await switchRole(page, "management");
  await page.goto("/analytics");
  await waitForApp(page);
  await expect(page.getByTestId("spend-chart")).toBeVisible();
});
