import { Page, expect } from "@playwright/test";

/** All internal nav routes that should resolve to a real screen. */
export const ALL_ROUTES = [
  "/dashboard", "/requisitions", "/approvals", "/sourcing", "/purchase-orders",
  "/deliveries", "/quality", "/invoices", "/payments", "/cashflow", "/returns",
  "/suppliers", "/items", "/budgets", "/analytics", "/inventory", "/admin",
];

/** Phase 5+ create/edge-case routes (no nav entry; reached via buttons). */
export const EXTRA_ROUTES = [
  "/requisitions/new", "/requisitions/auto-create",
  "/suppliers/new", "/suppliers/discover", "/items/new", "/items/artwork", "/items/permit-expiry",
  "/returns/new", "/sourcing/contract-supply", "/deliveries/tracking",
  "/cashflow/float", "/analytics/currency", "/admin/bulk-import",
  "/admin/users", "/admin/routing-rules", "/admin/masters", "/admin/fields",
  "/unauthorized",
];

/** Supplier portal routes (separate external shell; no internal nav/shell). */
export const PORTAL_ROUTES = [
  "/portal", "/portal/login", "/portal/rfq/RFQ-HERO", "/portal/po/PO-HERO", "/portal/invoice/new",
];

/** The role ids exposed by the role switcher (must match personas.ts). */
export const ROLE_IDS = [
  "requester", "approver", "buyer", "finance_maker", "finance_checker",
  "management", "receiving", "quality", "engineering", "budget_owner",
  "tax_compliance", "inventory_manager", "administrator",
];

/** Substrings that betray a stub / unfinished screen (must never appear). */
export const STUB_MARKERS = [
  "coming soon", "coming in phase", "per-role content", "not implemented",
  "todo", "placeholder", "lorem ipsum", "tbd",
];

/** Reset the in-memory store to a fresh deterministic seed (test isolation /
 *  demo reset). Must be called after the app has booted (MSW running). */
export async function resetStore(page: Page): Promise<void> {
  await page.goto("/dashboard");
  await waitForApp(page);
  await page.evaluate(async () => {
    await fetch("/api/__reset", { method: "POST" });
  });
}

/** Wait for the app shell to be interactive (providers booted, MSW started). */
export async function waitForApp(page: Page): Promise<void> {
  // The "Loading workspace…" gate disappears once MSW + seed are ready.
  await expect(page.getByText("Loading workspace…")).toBeHidden({ timeout: 20_000 }).catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
}

/** Switch the active persona via the role switcher (Radix Select). */
export async function switchRole(page: Page, roleId: string): Promise<void> {
  await page.goto("/dashboard");
  await waitForApp(page);
  const trigger = page.getByTestId("role-switcher").getByRole("combobox");
  await trigger.click();
  // Wait for the listbox to open, then click the option for this role.
  await page.getByRole("option").first().waitFor({ state: "visible", timeout: 5_000 });
  const escaped = titleFor(roleId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const option = page.getByRole("option", { name: new RegExp(escaped, "i") });
  await option.first().click();
  // Confirm the switch took effect (the trigger now shows this persona's title).
  await expect(page.getByTestId("role-switcher")).toContainText(titleFor(roleId), { timeout: 5_000 });
}

/** Map roleId -> the persona title shown in the switcher (mirror of personas.ts). */
export function titleFor(roleId: string): string {
  const map: Record<string, string> = {
    requester: "Requester", approver: "Approver", buyer: "Buyer",
    finance_maker: "Finance Maker", finance_checker: "Finance Checker",
    management: "Management", receiving: "Receiving", quality: "Quality",
    engineering: "Engineering", budget_owner: "Budget Owner",
    tax_compliance: "Tax / Compliance", inventory_manager: "Inventory Manager",
    administrator: "Administrator",
  };
  return map[roleId] ?? roleId;
}

/** Assert a rendered page is not a dead end: no error boundary, no stub text,
 *  no 404. Checks page body content (works for client-side nav too). */
export async function assertNotDeadEnd(page: Page, context: string): Promise<string[]> {
  const problems: string[] = [];
  const body = (await page.locator("body").innerText()).toLowerCase();

  for (const marker of STUB_MARKERS) {
    if (body.includes(marker)) problems.push(`${context}: stub marker "${marker}"`);
  }
  if (body.includes("application error") || body.includes("unhandled runtime error")) {
    problems.push(`${context}: runtime error on page`);
  }
  // Next.js default 404 ("404 | This page could not be found")
  if (body.includes("this page could not be found") || /\b404\b/.test(body)) {
    problems.push(`${context}: 404 not found`);
  }
  return problems;
}

/** Navigate to a URL and fail if the HTTP status is an error (4xx/5xx). */
export async function gotoOk(page: Page, url: string): Promise<void> {
  const res = await page.goto(url);
  if (res && res.status() >= 400) {
    throw new Error(`${url} returned HTTP ${res.status()}`);
  }
}
