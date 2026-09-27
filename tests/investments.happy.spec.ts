import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Investments — happy-path coverage.
 *
 * investments.negative.spec.ts already covers: no-match search, 3-fund selection
 * limit, Compare empty state, Calculator zero amount, Portfolio >100% error.
 *
 * These tests cover the complementary happy paths that were completely absent:
 *  - All 6 fund cards visible by default
 *  - Selecting a fund card marks it as selected; deselecting removes the badge
 *  - Compare tab renders a chart when at least one fund is selected
 *  - Calculator renders a non-flat projection with a positive investment amount
 *  - Portfolio Builder reaches the valid (green) state when total allocation = 100%
 */

test.describe('Investments — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Navigate to the Investments tab
    await new PageFactory(page).investments().navigate();
    await expect(page.getByRole('heading', { name: 'Investments' })).toBeVisible();
  });

  // ── Test 1 ────────────────────────────────────────────────────────────────
  // All 6 fund cards are visible by default on the Fund Cards sub-tab.
  test('all 6 fund cards are visible on the Fund Cards tab', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await expect(investments.fundCards).toHaveCount(6);
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────
  // Clicking a fund card selects it — the "✓ Selected" badge appears.
  // Clicking again deselects it — the badge disappears.
  test('selecting a fund card shows a selected badge; deselecting removes it', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Initially no fund is selected
    await expect(investments.selectedBadges).toHaveCount(0);

    // Select the first fund
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(1);

    // Deselect the same fund
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(0);
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────
  // Compare tab renders a chart (not the empty state) when a fund is selected.
  test('Compare tab shows a chart when at least one fund is selected', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select one fund
    await investments.selectFundCard(0);

    // Switch to Compare sub-tab
    await investments.goToSubTab('Compare');

    // The empty-state message must NOT be visible
    await expect(investments.compareEmptyState).not.toBeVisible();

    // A Recharts SVG element must be visible (line chart rendered)
    await expect(page.locator('.recharts-surface').first()).toBeVisible();
  });

  // ── Test 4 ────────────────────────────────────────────────────────────────
  // Calculator renders a non-flat projection with the default $10,000 amount.
  test('Calculator shows a non-zero Y-axis projection with the default investment amount', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    // The default amount input should be pre-filled with 10000
    await expect(investments.calculatorAmountInput).toHaveValue('10000');

    // Y-axis ticks should NOT all be $0.00 — at least one must show a positive amount
    const ticks = investments.calculatorYAxisTicks;
    await expect(ticks.first()).toBeVisible();
    const tickTexts = await ticks.allTextContents();
    const hasNonZero = tickTexts.some(t => !t.match(/^\$?0(\.0+)?$/));
    expect(hasNonZero, 'At least one Y-axis tick must show a non-zero value').toBe(true);
  });

  // ── Test 5 ────────────────────────────────────────────────────────────────
  // Portfolio Builder shows the "green / valid" total label when a single
  // slider is set to 100%.
  test('Portfolio Builder shows a valid (non-red) total when one slider is at 100%', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Set the first slider to 100 and all others to 0 (default is 0 for all)
    await investments.setPortfolioSlider(0, 100);

    // The total label should be present and NOT carry the error colour
    await expect(investments.portfolioTotalLabel).toBeVisible();
    await expect(investments.portfolioTotalLabel).not.toHaveClass(/text-red-400/);
    await expect(investments.portfolioTotalLabel).toContainText('100');
  });
});
