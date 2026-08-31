import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();

  const investments = factory.investments();
  await investments.navigate();
  // Land on the Portfolio Builder sub-tab
  await investments.goToSubTab('Portfolio Builder');
});

// ─── Portfolio Builder — 100% allocation shows chart & green total ─────────────

// The Portfolio Builder shows sliders for each fund.  When allocations sum
// to exactly 100% the total counter turns green and the blended return + donut
// chart render.  This is the core happy-path complement to the negative "over
// 100%" test that already exists in investments.negative.spec.ts.
test('allocating exactly 100% across funds shows green total and donut chart', async ({ page }) => {
  const investments = new PageFactory(page).investments();

  // Sliders should be present
  await expect(investments.portfolioSliders.first()).toBeVisible();
  const sliderCount = await investments.portfolioSliders.count();
  expect(sliderCount).toBeGreaterThan(0);

  // Distribute 100% evenly across sliders
  // Each fund gets floor(100 / count); the last fund absorbs the remainder
  const perSlider = Math.floor(100 / sliderCount);
  const remainder = 100 - perSlider * sliderCount;

  for (let i = 0; i < sliderCount; i++) {
    const value = i === sliderCount - 1 ? perSlider + remainder : perSlider;
    await investments.setPortfolioSlider(i, value);
  }

  // The total label should now read "100%" and be styled green
  const totalLabel = page.locator('text=/100%/').first();
  await expect(totalLabel).toBeVisible();

  // The green style is applied when allocations are valid
  const totalEl = page.locator('[class*="green"], [class*="emerald"]').filter({ hasText: /100%/ }).first();
  await expect(totalEl).toBeVisible();

  // The blended annual return figure should be displayed (non-zero)
  const blendedReturn = page
    .locator('div')
    .filter({ hasText: /blended.*return|annual.*return/i })
    .first();
  await expect(blendedReturn).toBeVisible();

  // A Recharts donut (pie) chart should render
  const donutChart = page.locator('.recharts-pie, .recharts-pie-sector').first();
  await expect(donutChart).toBeVisible();
});

// ─── Portfolio Builder — uneven total shows warning, not the chart ────────────

// If sliders don't sum to 100%, the app should warn the user rather than
// silently rendering an incorrect chart.  (Complements the negative tests.)
test('uneven allocation shows a warning about the total not being 100%', async ({ page }) => {
  const investments = new PageFactory(page).investments();

  await expect(investments.portfolioSliders.first()).toBeVisible();

  // Set only the first slider to 50% — leave others at defaults
  await investments.setPortfolioSlider(0, 50);

  // A warning or instruction should be visible
  const warning = page.locator('div, p, span').filter({ hasText: /must equal 100|not.*100|adjust/i }).first();
  await expect(warning).toBeVisible();
});
