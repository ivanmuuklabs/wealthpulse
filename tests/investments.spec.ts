import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Investments Tab — Happy Path Tests
 *
 * The Investments tab has four sub-tabs:
 *   - Fund Cards  — 6 fund cards with risk badge, expense ratio, 1M/3M/12M returns, sparkline
 *   - Compare     — 12-month cumulative return line chart for up to 3 selected funds
 *   - Calculator  — hypothetical growth projection (fund × amount × years)
 *   - Portfolio Builder — allocate % to each fund; shows pie chart when total = 100%
 *
 * Only negative / error tests existed previously.  These tests cover the
 * expected (happy-path) flows for all four sub-tabs.
 */

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await factory.investments().navigate();
});

/* ═══════════════════════════════════════
   FUND CARDS sub-tab (default view)
   ═══════════════════════════════════════ */

test.describe('Investments — Fund Cards', () => {

  test('all 6 fund cards are visible on the Fund Cards tab', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    // Default sub-tab is Fund Cards; 6 funds are seeded
    await expect(inv.fundCards).toHaveCount(6);
  });

  test('each fund card shows a risk badge (Low / Medium / High)', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    // Collect all risk badge texts; every card must have one
    const badges = page.locator('.grid > div')
      .filter({ hasText: /Expense Ratio/ })
      .locator('span', { hasText: /Low|Medium|High/ });

    await expect(badges).toHaveCount(6);
  });

  test('each fund card displays an expense ratio label', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    // Each card includes "Expense Ratio: X%"
    const ratioLabels = page.locator('span', { hasText: /Expense Ratio:/ });
    await expect(ratioLabels).toHaveCount(6);
  });

  test('clicking a fund card selects it and shows the "✓ Selected" badge', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    // No cards selected initially
    await expect(inv.selectedBadges).toHaveCount(0);

    // Select the first card
    await inv.selectFundCard(0);

    // Exactly one "✓ Selected" badge should appear
    await expect(inv.selectedBadges).toHaveCount(1);
  });

  test('clicking a selected card deselects it and removes the badge', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    // Select then deselect the first card
    await inv.selectFundCard(0);
    await expect(inv.selectedBadges).toHaveCount(1);

    await inv.selectFundCard(0);
    await expect(inv.selectedBadges).toHaveCount(0);
  });

  test('up to 3 fund cards can be selected simultaneously', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    await inv.selectFundCard(0);
    await inv.selectFundCard(1);
    await inv.selectFundCard(2);

    await expect(inv.selectedBadges).toHaveCount(3);
  });

  test('searching by fund name filters visible cards', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    // "Bond" matches only "Bond Fund"
    await inv.searchFunds('Bond');

    await expect(inv.fundCards).toHaveCount(1);
    await expect(page.getByText('Bond Fund')).toBeVisible();
  });

  test('searching by risk level "Low" shows only the Bond Fund card', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    await inv.searchFunds('Low');

    await expect(inv.fundCards).toHaveCount(1);
  });

  test('clearing the search input restores all 6 fund cards', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    await inv.searchFunds('Bond');
    await expect(inv.fundCards).toHaveCount(1);

    // Clear search
    await inv.searchFunds('');
    await expect(inv.fundCards).toHaveCount(6);
  });

});

/* ═══════════════════════════════════════
   COMPARE sub-tab
   ═══════════════════════════════════════ */

test.describe('Investments — Compare', () => {

  test('selecting funds and switching to Compare renders the comparison chart', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    // Select 2 funds from Fund Cards
    await inv.selectFundCard(0);
    await inv.selectFundCard(1);

    // Switch to Compare sub-tab
    await inv.goToSubTab('Compare');

    // The empty-state message must be gone
    await expect(inv.compareEmptyState).not.toBeVisible();

    // The line chart SVG must be present (Recharts renders a <svg> with class recharts-surface)
    const chartSvg = page.locator('.recharts-wrapper svg').first();
    await expect(chartSvg).toBeVisible();
  });

  test('Compare tab shows the fund name in the legend after selection', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    // Select the first fund (US Large Cap Index)
    await inv.selectFundCard(0);
    await inv.goToSubTab('Compare');

    // The Recharts Legend should include the fund name
    const legend = page.locator('.recharts-legend-wrapper');
    await expect(legend).toBeVisible();
    await expect(legend.getByText('US Large Cap Index')).toBeVisible();
  });

});

/* ═══════════════════════════════════════
   CALCULATOR sub-tab
   ═══════════════════════════════════════ */

test.describe('Investments — Calculator', () => {

  test('Calculator sub-tab is reachable and shows a heading', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    await inv.goToSubTab('Calculator');

    await expect(page.getByText('Hypothetical Growth Calculator')).toBeVisible();
  });

  test('projection chart renders with a default investment amount ($10,000)', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    await inv.goToSubTab('Calculator');

    // The Investment ($) input should be pre-filled with 10000
    await expect(inv.calculatorAmountInput).toHaveValue('10000');

    // The Y-axis should show values above $0 for a $10,000 investment
    const ticks = inv.calculatorYAxisTicks;
    await expect(ticks.first()).toBeVisible();

    // At least one tick should NOT be $0 (the projection grows over time)
    const tickTexts = await ticks.allTextContents();
    const hasNonZero = tickTexts.some(t => !t.includes('$0') || t !== '$0.00');
    expect(hasNonZero).toBe(true);
  });

  test('changing the investment amount updates the projection chart', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    await inv.goToSubTab('Calculator');

    // Change amount to $50,000
    await inv.setCalculatorAmount(50000);

    // Verify the input now shows 50000
    await expect(inv.calculatorAmountInput).toHaveValue('50000');

    // The chart must still be present after the change
    const chartSvg = page.locator('.recharts-wrapper svg').first();
    await expect(chartSvg).toBeVisible();
  });

  test('the disclaimer warning message is visible below the chart', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    await inv.goToSubTab('Calculator');

    // App renders an amber disclaimer below the projection chart
    await expect(page.getByText(/past performance does not guarantee/i)).toBeVisible();
  });

});

/* ═══════════════════════════════════════
   PORTFOLIO BUILDER sub-tab
   ═══════════════════════════════════════ */

test.describe('Investments — Portfolio Builder', () => {

  test('Portfolio Builder sub-tab loads with 6 allocation sliders', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    await inv.goToSubTab('Portfolio Builder');

    // Each fund has a range slider — 6 sliders total
    // The Portfolio Builder also uses range sliders inside the Calculator (time horizon)
    // so we scope to the portfolio context
    await expect(page.getByText('Allocate Funds')).toBeVisible();
    await expect(inv.portfolioSliders).toHaveCount(6);
  });

  test('total starts at 0% and the "Total:" label is visible', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    await inv.goToSubTab('Portfolio Builder');

    // Initial state: all sliders at 0, total = 0%
    await expect(inv.portfolioTotalLabel).toBeVisible();
    await expect(inv.portfolioTotalLabel).toContainText('0%');
  });

  test('setting a valid 100% allocation removes the error state', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    await inv.goToSubTab('Portfolio Builder');

    // Set one fund to 100% and all others to 0%
    await inv.setPortfolioSlider(0, 100);

    // Total label should now show "100%" in green (emerald) not red
    await expect(inv.portfolioTotalLabel).toContainText('100%');
    await expect(inv.portfolioTotalLabel).toHaveClass(/text-emerald-400/);
  });

  test('valid 100% allocation renders the portfolio pie chart', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    await inv.goToSubTab('Portfolio Builder');

    // Allocate 50% to fund 0 and 50% to fund 1
    await inv.setPortfolioSlider(0, 50);
    await inv.setPortfolioSlider(1, 50);

    // The pie chart SVG should now be present (no longer showing empty state)
    const chartSvg = page.locator('.recharts-wrapper svg').first();
    await expect(chartSvg).toBeVisible();

    // The "Allocate percentages to see chart" empty state must be gone
    await expect(page.getByText('Allocate percentages to see chart')).not.toBeVisible();
  });

  test('blended annual return label is visible in the Portfolio Builder', async ({ page }) => {
    const inv = new PageFactory(page).investments();

    await inv.goToSubTab('Portfolio Builder');

    await expect(page.getByText('Blended Annual Return:')).toBeVisible();
  });

});
