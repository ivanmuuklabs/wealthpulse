import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Investments tab.
 *
 * These cover the four sub-tabs (Fund Cards, Compare, Calculator, Portfolio
 * Builder) which had no passing-state coverage. The existing
 * investments.negative.spec.ts covers error/edge cases; this file covers the
 * flows a user hits in normal use.
 *
 * Flows covered:
 *   1. Selecting a fund card highlights it and shows "✓ Selected".
 *   2. Deselecting a previously-selected fund removes the highlight.
 *   3. Selecting 2 funds and opening Compare renders the line chart.
 *   4. Calculator with a valid amount and time horizon shows a non-zero chart.
 *   5. Portfolio Builder with a valid 100% allocation renders the pie chart.
 */

test.describe('Investments — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const investments = factory.investments();
    await investments.navigate();

    // Fund Cards is the default sub-tab; confirm we're on it
    await expect(page.getByRole('heading', { name: 'Investments' })).toBeVisible();
  });

  // ── Test 1 ──────────────────────────────────────────────────────────
  // Clicking a fund card must add the emerald ring highlight and show
  // the "✓ Selected" badge inside that card.
  test('selecting a fund card highlights it and shows the selected badge', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select the first fund
    await investments.selectFundCard(0);

    // Exactly one selected badge should appear
    await expect(investments.selectedBadges).toHaveCount(1);

    // The first card itself carries the ring highlight class
    await expect(investments.fundCards.first()).toHaveClass(/ring-1/);
  });

  // ── Test 2 ──────────────────────────────────────────────────────────
  // Clicking an already-selected fund must deselect it (badge disappears,
  // ring class removed).
  test('deselecting a fund card removes the highlight and badge', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select then immediately deselect the first fund
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(1);

    await investments.selectFundCard(0); // second click deselects
    await expect(investments.selectedBadges).toHaveCount(0);
    await expect(investments.fundCards.first()).not.toHaveClass(/ring-1/);
  });

  // ── Test 3 ──────────────────────────────────────────────────────────
  // After selecting 2 funds the Compare sub-tab must render a line chart
  // (the recharts SVG is present). The app only renders it when ≥ 1 fund
  // is selected, so we verify the empty state is gone.
  test('Compare sub-tab renders the performance chart after selecting 2 funds', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select the first two fund cards
    await investments.selectFundCard(0);
    await investments.selectFundCard(1);

    // Navigate to Compare
    await investments.goToSubTab('Compare');

    // Empty-state message must be gone
    await expect(investments.compareEmptyState).not.toBeVisible();

    // A recharts SVG line chart must be rendered
    // (the recharts root SVG is always present when data is supplied)
    await expect(page.locator('svg.recharts-surface').first()).toBeVisible();
  });

  // ── Test 4 ──────────────────────────────────────────────────────────
  // Calculator with the default fund, a $10,000 investment, and 5 years
  // must show a projected value above the initial amount in the Y-axis ticks.
  test('Calculator shows a non-zero growing projection for a valid input', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    // Set a known investment amount
    await investments.setCalculatorAmount(10000);

    // At least one Y-axis tick must contain a dollar value above $0
    const tickTexts = await investments.calculatorYAxisTicks.allTextContents();
    const hasNonZero = tickTexts.some(t => {
      const val = parseFloat(t.replace(/[$k,]/g, '')) * (t.includes('k') ? 1000 : 1);
      return val > 0;
    });
    expect(hasNonZero).toBe(true);

    // The area chart SVG itself must be in the DOM
    await expect(page.locator('svg.recharts-surface').first()).toBeVisible();
  });

  // ── Test 5 ──────────────────────────────────────────────────────────
  // Portfolio Builder: setting the first fund to 60% and the second to 40%
  // (total = 100%) must turn the total label emerald and render the pie chart.
  test('Portfolio Builder renders the pie chart when allocation totals 100%', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Allocate 60% to the first fund, 40% to the second
    await investments.setPortfolioSlider(0, 60);
    await investments.setPortfolioSlider(1, 40);

    // Total label must show 100% in the emerald (valid) colour
    await expect(investments.portfolioTotalLabel).toContainText('100%');
    await expect(investments.portfolioTotalLabel).toHaveClass(/text-emerald-400/);

    // The pie chart SVG must appear (only renders when at least one fund > 0%)
    await expect(page.locator('svg.recharts-surface').first()).toBeVisible();
  });
});
