/**
 * Route + action crawler — the systematic "no dead ends" safety net.
 *
 * Layer 1: every internal route resolves to a real screen (no 404, no stub
 *          marker, no runtime error) and console stays clean.
 * Layer 2: list screens actually populate from MSW (real seed data renders,
 *          not a permanent skeleton or empty state where data exists).
 * Layer 3: interactive controls (nav links, the command palette, the role
 *          switcher, row clicks) work without breaking.
 *
 * This catches the class of failure the prior build shipped (a route silently
 * rendering a "coming in Phase 3" stub). Grows per phase as screens land.
 */
import { test, expect } from "@playwright/test";
import {
  ALL_ROUTES, EXTRA_ROUTES, PORTAL_ROUTES, ROLE_IDS, waitForApp, switchRole, assertNotDeadEnd, titleFor,
} from "./helpers";

// Collect console errors per test for assertion.
function trackConsole(page: import("@playwright/test").Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const t = msg.text();
      // ignore benign favicon / MSW info noise
      if (!/favicon|Download the React DevTools|\[MSW\]/i.test(t)) errors.push(t);
    }
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

test.describe("Layer 1: every route resolves to a real screen (admin sees all)", () => {
  for (const route of ALL_ROUTES) {
    test(`route ${route} is not a dead end`, async ({ page }) => {
      const errors = trackConsole(page);
      await page.goto(route);
      await waitForApp(page);
      // a heading must render (PageHeader h1 or dashboard greeting)
      await expect(page.locator("h1").first()).toBeVisible();
      const problems = await assertNotDeadEnd(page, route);
      expect(problems, problems.join("\n")).toEqual([]);
      expect(errors, errors.join("\n")).toEqual([]);
    });
  }
});

test.describe("Layer 1b: create / edge-case routes resolve to real screens", () => {
  for (const route of EXTRA_ROUTES) {
    test(`route ${route} is not a dead end`, async ({ page }) => {
      const errors = trackConsole(page);
      await page.goto(route);
      await waitForApp(page);
      await expect(page.locator("h1").first()).toBeVisible();
      const problems = await assertNotDeadEnd(page, route);
      expect(problems, problems.join("\n")).toEqual([]);
      expect(errors, errors.join("\n")).toEqual([]);
    });
  }
});

test.describe("Layer 1c: supplier portal routes resolve (external shell)", () => {
  for (const route of PORTAL_ROUTES) {
    test(`portal route ${route} is not a dead end`, async ({ page }) => {
      const errors = trackConsole(page);
      // portal has its own shell; wait for the portal header instead of the app shell
      await page.goto(route);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(400);
      await expect(page.getByText(/supplier portal/i).first()).toBeVisible({ timeout: 15_000 });
      const problems = await assertNotDeadEnd(page, route);
      expect(problems, problems.join("\n")).toEqual([]);
      expect(errors, errors.join("\n")).toEqual([]);
    });
  }
});

test.describe("Layer 2: list screens populate from MSW", () => {
  const populated = [
    { route: "/requisitions" }, { route: "/suppliers" }, { route: "/items" },
    { route: "/purchase-orders" }, { route: "/invoices" }, { route: "/budgets" },
    { route: "/quality" }, { route: "/analytics" }, { route: "/inventory" },
  ];
  for (const { route } of populated) {
    test(`${route} renders real rows`, async ({ page }) => {
      await page.goto(route);
      await waitForApp(page);
      // either real data rows OR a designed empty state — never a stuck skeleton
      const rows = page.getByTestId("data-row");
      const empty = page.getByTestId("empty-state");
      await expect(rows.first().or(empty)).toBeVisible({ timeout: 15_000 });
      // for these seeded collections we expect actual rows
      await expect(rows.first()).toBeVisible({ timeout: 15_000 });
    });
  }
});

test.describe("Layer 3: shell controls work", () => {
  test("command palette opens and lists destinations", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForApp(page);
    await page.getByTestId("command-trigger").click();
    await expect(page.getByPlaceholder("Go to…")).toBeVisible();
    await expect(page.locator('[cmdk-item]').first()).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("row click navigates to a detail route (no dead end)", async ({ page }) => {
    await page.goto("/suppliers");
    await waitForApp(page);
    const listUrl = page.url();
    await page.getByTestId("data-row").first().click();
    // wait until the URL actually changes to the detail route, then settle
    await page.waitForURL((u) => u.toString() !== listUrl, { timeout: 10_000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(300);
    const problems = await assertNotDeadEnd(page, "supplier detail");
    expect(problems, problems.join("\n")).toEqual([]);
    // the detail page must show its back button (proof the real screen rendered)
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible();
  });
});

test.describe("Layer 5: every list's detail route resolves (no 404 dead ends)", () => {
  const lists = [
    "/requisitions", "/suppliers", "/items", "/purchase-orders", "/invoices",
    "/payments", "/deliveries", "/quality", "/returns", "/sourcing",
  ];
  for (const route of lists) {
    test(`first row of ${route} opens a real detail page`, async ({ page }) => {
      await page.goto(route);
      await waitForApp(page);
      const firstRow = page.getByTestId("data-row").first();
      const empty = page.getByTestId("empty-state");
      // if the list is legitimately empty, skip (no row to click)
      if ((await empty.count()) > 0 && (await firstRow.count()) === 0) return;
      const listUrl = page.url();
      await firstRow.click();
      await page.waitForURL((u) => u.toString() !== listUrl, { timeout: 10_000 });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(300);
      const problems = await assertNotDeadEnd(page, `${route} detail`);
      expect(problems, problems.join("\n")).toEqual([]);
    });
  }
});

test.describe("Layer 4: every persona lands on a real home", () => {
  for (const roleId of ROLE_IDS) {
    test(`persona ${roleId} has a working sidebar + home`, async ({ page }) => {
      const errors = trackConsole(page);
      await switchRole(page, roleId);
      await waitForApp(page);
      // sidebar must render at least one nav item
      await expect(page.getByTestId("sidebar-nav").locator("a").first()).toBeVisible();
      // the persona title shows in the topbar
      await expect(page.getByTestId("role-switcher")).toContainText(titleFor(roleId));
      const problems = await assertNotDeadEnd(page, `persona ${roleId} home`);
      expect(problems, problems.join("\n")).toEqual([]);
      expect(errors, errors.join("\n")).toEqual([]);
    });
  }
});
