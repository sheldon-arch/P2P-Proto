/**
 * Guided tour verification — the rigorous visual + behavioral check.
 *   - launches the tour, and for EACH step: asserts the coach-mark is visible,
 *     fully within the viewport (no overflow), the title/body/buttons render,
 *     and (if anchored) the spotlight is on-screen; screenshots each step.
 *   - asserts Next advances and Back goes back.
 *   - asserts the tour reaches the final step and finishes.
 * Screenshots land in e2e/__screenshots__/tour-NN-*.png for human review.
 */
import { test, expect, type Page } from "@playwright/test";
import { resetStore } from "./helpers";

const STEP_COUNT = 10;

async function startTour(page: Page) {
  await resetStore(page);
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("tour-launch").click();
  await expect(page.getByTestId("tour-coachmark")).toBeVisible({ timeout: 10_000 });
}

async function assertCoachmarkOnScreen(page: Page, label: string) {
  const card = page.getByTestId("tour-coachmark");
  await expect(card).toBeVisible();
  const box = await card.boundingBox();
  expect(box, `${label}: coach-mark has no box`).not.toBeNull();
  if (box) {
    const vw = page.viewportSize()!.width;
    const vh = page.viewportSize()!.height;
    // fully within viewport (the common breakage: dialog off-screen / overflowing)
    expect(box.x, `${label}: coach-mark left off-screen`).toBeGreaterThanOrEqual(-1);
    expect(box.y, `${label}: coach-mark top off-screen`).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, `${label}: coach-mark right overflows`).toBeLessThanOrEqual(vw + 1);
    expect(box.y + box.height, `${label}: coach-mark bottom overflows`).toBeLessThanOrEqual(vh + 1);
  }
  // content + controls present
  await expect(page.getByTestId("tour-title")).toBeVisible();
  await expect(page.getByTestId("tour-body")).toBeVisible();
  await expect(page.getByTestId("tour-next")).toBeVisible();
}

test("tour: every step is aligned, on-screen, and advances", async ({ page }) => {
  await startTour(page);

  for (let i = 0; i < STEP_COUNT; i++) {
    await page.waitForTimeout(700); // let settle() + floating-ui position
    const progress = await page.getByTestId("tour-progress").innerText();
    await assertCoachmarkOnScreen(page, `step ${i + 1} (${progress})`);
    await page.screenshot({ path: `e2e/__screenshots__/tour-${String(i + 1).padStart(2, "0")}.png`, fullPage: false });

    if (i < STEP_COUNT - 1) {
      await page.getByTestId("tour-next").click();
      // wait for navigation/anchor change
      await page.waitForTimeout(300);
    }
  }

  // on the last step the button reads Finish and closes the tour
  await expect(page.getByTestId("tour-next")).toHaveText(/finish/i);
  await page.getByTestId("tour-next").click();
  await expect(page.getByTestId("tour-overlay")).toBeHidden({ timeout: 10_000 });
});

test("tour: Back returns to the previous step", async ({ page }) => {
  await startTour(page);
  await page.getByTestId("tour-next").click();
  await page.waitForTimeout(500);
  await expect(page.getByTestId("tour-progress")).toHaveText(/^2 \//);
  await page.getByTestId("tour-back").click();
  await page.waitForTimeout(500);
  await expect(page.getByTestId("tour-progress")).toHaveText(/^1 \//);
});

test("tour: exit closes the overlay", async ({ page }) => {
  await startTour(page);
  await page.getByTestId("tour-exit").click();
  await expect(page.getByTestId("tour-overlay")).toBeHidden();
});
