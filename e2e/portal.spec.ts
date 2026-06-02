/**
 * Supplier portal flow (the two-sided system). The external supplier submits a
 * quote, acknowledges a PO, and submits an invoice — each landing in the
 * internal store the buyer/finance see.
 */
import { test, expect } from "@playwright/test";
import { resetStore } from "./helpers";

test.beforeEach(async ({ page }) => {
  await resetStore(page);
});

test("supplier submits a quote from the portal", async ({ page }) => {
  await page.goto("/portal/rfq/RFQ-HERO");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("quote-unit").fill("142.50");
  await page.getByTestId("quote-freight").fill("8");
  await page.getByTestId("quote-duty").fill("9");
  await page.getByTestId("submit-quote").click();
  await expect(page.getByText(/quote submitted/i).first()).toBeVisible({ timeout: 10_000 });
});

test("supplier submits an invoice from the portal", async ({ page }) => {
  await page.goto("/portal/invoice/new");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("inv-number").fill("SUP-INV-9001");
  await page.getByTestId("inv-amount").fill("5000");
  await page.getByTestId("submit-invoice").click();
  await expect(page.getByText(/invoice submitted/i).first()).toBeVisible({ timeout: 10_000 });
});

test("portal login (mock OTP) reaches the portal home", async ({ page }) => {
  await page.goto("/portal/login");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("login-send-otp").click();
  await page.getByTestId("login-otp").fill("123456");
  await page.getByTestId("login-verify").click();
  await expect(page).toHaveURL(/\/portal$/, { timeout: 10_000 });
});
