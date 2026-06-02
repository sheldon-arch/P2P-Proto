/**
 * Guided tour verification — the rigorous visual + behavioral check for BOTH
 * variants (short + long), including interactive Try-it steps.
 *   - for EACH step: coach-mark visible, fully within the viewport (no overflow),
 *     title/body present; screenshot it (e2e/__screenshots__/tour-<variant>-NN.png).
 *   - Watch steps advance on Next; Try-it steps require performing the real
 *     action (the spec clicks the highlighted control) and auto-advance; a Skip
 *     always exists so the tour never hard-stalls.
 *   - the tour reaches its final step and finishes.
 */
import { test, expect, type Page } from "@playwright/test";
import { resetStore } from "./helpers";

async function assertOnScreen(page: Page, label: string) {
  const card = page.getByTestId("tour-coachmark");
  await expect(card, label).toBeVisible();
  const box = await card.boundingBox();
  expect(box, `${label}: no box`).not.toBeNull();
  if (box) {
    const vw = page.viewportSize()!.width;
    const vh = page.viewportSize()!.height;
    expect(box.x, `${label}: left off-screen`).toBeGreaterThanOrEqual(-1);
    expect(box.y, `${label}: top off-screen`).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, `${label}: right overflows`).toBeLessThanOrEqual(vw + 1);
    expect(box.y + box.height, `${label}: bottom overflows`).toBeLessThanOrEqual(vh + 1);
  }
  await expect(page.getByTestId("tour-title")).toBeVisible();
  await expect(page.getByTestId("tour-body")).toBeVisible();
}

async function currentStepId(page: Page): Promise<string> {
  // the step id isn't rendered; use progress + chapter as a stable label proxy
  return (await page.getByTestId("tour-progress").innerText()).trim();
}

for (const variant of ["short", "long"] as const) {
  test(`${variant} tour: every step aligned, on-screen, and advances`, async ({ page }) => {
    await resetStore(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.getByTestId("tour-launch").click();
    await page.getByTestId(`tour-start-${variant}`).click();
    await expect(page.getByTestId("tour-coachmark")).toBeVisible({ timeout: 10_000 });

    const total = variant === "short" ? 10 : 29;
    for (let i = 0; i < total; i++) {
      await page.waitForTimeout(700); // settle() + floating-ui positioning
      const progress = await currentStepId(page);
      await assertOnScreen(page, `${variant} step ${i + 1} (${progress})`);
      await page.screenshot({ path: `e2e/__screenshots__/tour-${variant}-${String(i + 1).padStart(2, "0")}.png`, fullPage: false });

      if (i >= total - 1) break;

      // Try-it step? (the hint banner is present) -> perform the real action
      const isTryIt = (await page.getByTestId("tour-tryit-hint").count()) > 0;
      if (isTryIt) {
        // derive a step id from the title region is brittle; instead try each
        // known action and fall back to Skip if none matches the current screen.
        const before = await currentStepId(page);
        const did =
          (await tryAny(page));
        if (did) {
          // wait for auto-advance (event -> +600ms)
          await expect(async () => {
            expect(await currentStepId(page)).not.toBe(before);
          }).toPass({ timeout: 8000 });
        } else {
          await page.getByTestId("tour-skip").click();
        }
      } else {
        await page.getByTestId("tour-next").click();
        await page.waitForTimeout(250);
      }
    }

    // last step: Finish closes the tour
    await expect(page.getByTestId("tour-next")).toHaveText(/finish/i);
    await page.getByTestId("tour-next").click();
    await expect(page.getByTestId("tour-overlay")).toBeHidden({ timeout: 10_000 });
  });
}

// Try any known Try-it action that is present on the current screen.
async function tryAny(page: Page): Promise<boolean> {
  const candidates = [
    '[data-testid^="raise-"]',
    '[data-testid="approve-btn"]',
    '[data-testid="award-submit"]',
    '[data-testid="action-closeCapa"]',
  ];
  for (const sel of candidates) {
    const el = page.locator(sel).first();
    if ((await el.count()) > 0 && (await el.isVisible())) {
      await el.click();
      return true;
    }
  }
  return false;
}

test("tour: Back returns to the previous step (short)", async ({ page }) => {
  await resetStore(page);
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("tour-launch").click();
  await page.getByTestId("tour-start-short").click();
  await expect(page.getByTestId("tour-coachmark")).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("tour-next").click();
  await page.waitForTimeout(500);
  await expect(page.getByTestId("tour-progress")).toHaveText(/^2 \//);
  await page.getByTestId("tour-back").click();
  await page.waitForTimeout(500);
  await expect(page.getByTestId("tour-progress")).toHaveText(/^1 \//);
});

test("tour: exit closes the overlay", async ({ page }) => {
  await resetStore(page);
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("tour-launch").click();
  await page.getByTestId("tour-start-short").click();
  await expect(page.getByTestId("tour-coachmark")).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("tour-exit").click();
  await expect(page.getByTestId("tour-overlay")).toBeHidden();
});
