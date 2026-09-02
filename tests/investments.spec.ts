import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Investments module.
 *
 * Covers the four sub-tabs — Fund Cards, Compare, Calculator, Portfolio Builder —
 * verifying the core user flows documented in the app spec.
 *
 * Negative / edge-case scenarios live in investments.negative.spec.ts.
 */

test.describe('Investments', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Investments module
    const investmentsPage = factory.investments();
    await investmentsPage.navigate();
  });

  // ──────────────────────────────────────────────────────────────
  // Fund Cards sub-tab
  // ──────────────────────────────────────────────────────────────

  test.describe('Fund Cards', () => {
    test('displays all 6 fund cards on initial load', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      // All 6 fund cards must be visible without any search filter applied
      await expect(investmentsPage.fundCards).toHaveCount(6);
    });

    test('selecting a single fund card highlights it with a selected badge', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      await investmentsPage.selectFundCard(0);

      // The first card should show the selected indicator
      await expect(investmentsPage.selectedBadges).toHaveCount(1);
      await expect(investmentsPage.fundCards.nth(0)).toHaveClass(/ring-1/);
    });

    test('selecting up to 3 fund cards shows 3 selected badges', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      await investmentsPage.selectFundCard(0);
      await investmentsPage.selectFundCard(1);
      await investmentsPage.selectFundCard(2);

      await expect(investmentsPage.selectedBadges).toHaveCount(3);
    });

    test('deselecting a selected fund card removes its selected badge', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      // Select then immediately deselect the first card
      await investmentsPage.selectFundCard(0);
      await expect(investmentsPage.selectedBadges).toHaveCount(1);

      await investmentsPage.selectFundCard(0);
      await expect(investmentsPage.selectedBadges).toHaveCount(0);
    });

    test('search filters fund cards by name in real time', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      // Search for a partial term present in at least one fund name/type/risk
      await investmentsPage.searchFunds('bond');

      // At least one card matches; all 6 should not be shown (filter is applied)
      const count = await investmentsPage.fundCards.count();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(6);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Compare sub-tab
  // ──────────────────────────────────────────────────────────────

  test.describe('Compare', () => {
    test('selecting 1 fund and opening Compare renders the line chart', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      await investmentsPage.selectFundCard(0);
      await investmentsPage.goToSubTab('Compare');

      // The line chart must be visible; the empty-state placeholder must not be
      await expect(investmentsPage.comparisonChart).toBeVisible();
      await expect(investmentsPage.compareEmptyState).not.toBeVisible();
    });

    test('selecting 2 funds and opening Compare renders the line chart', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      await investmentsPage.selectFundCard(0);
      await investmentsPage.selectFundCard(1);
      await investmentsPage.goToSubTab('Compare');

      await expect(investmentsPage.comparisonChart).toBeVisible();
    });

    test('selecting 3 funds and opening Compare renders the line chart with a legend', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      await investmentsPage.selectFundCard(0);
      await investmentsPage.selectFundCard(1);
      await investmentsPage.selectFundCard(2);
      await investmentsPage.goToSubTab('Compare');

      // Chart and legend (one entry per selected fund) must both be visible
      await expect(investmentsPage.comparisonChart).toBeVisible();
      const legendItems = page.locator('.recharts-legend-item');
      await expect(legendItems).toHaveCount(3);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Calculator sub-tab
  // ──────────────────────────────────────────────────────────────

  test.describe('Calculator', () => {
    test('Calculator sub-tab renders the amount input and time-horizon slider', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      await investmentsPage.goToSubTab('Calculator');

      await expect(investmentsPage.calculatorAmountInput).toBeVisible();
      await expect(investmentsPage.calculatorTimeHorizonSlider).toBeVisible();
    });

    test('entering a valid amount ($10,000) with default horizon renders the area chart', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      await investmentsPage.goToSubTab('Calculator');
      await investmentsPage.setCalculatorAmount(10000);

      // Area chart should render with a non-zero projection
      await expect(investmentsPage.calculatorAreaChart).toBeVisible();

      // At least one Y-axis tick should not be $0 (meaningful projection)
      const tickTexts = await investmentsPage.calculatorYAxisTicks.allTextContents();
      const hasNonZero = tickTexts.some(t => t.match(/\$[1-9]/));
      expect(hasNonZero).toBe(true);
    });

    test('changing the investment amount updates the area chart projection', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      await investmentsPage.goToSubTab('Calculator');

      // Set a lower amount and record the Y-axis max tick
      await investmentsPage.setCalculatorAmount(5000);
      await expect(investmentsPage.calculatorAreaChart).toBeVisible();
      const lowTicks = await investmentsPage.calculatorYAxisTicks.allTextContents();

      // Set a higher amount — the chart max value should increase
      await investmentsPage.setCalculatorAmount(25000);
      const highTicks = await investmentsPage.calculatorYAxisTicks.allTextContents();

      // The highest Y-axis tick for $25k must differ from the $5k one
      expect(highTicks[highTicks.length - 1]).not.toEqual(lowTicks[lowTicks.length - 1]);
    });

    test('setting the time horizon to 10 years renders more X-axis ticks than 2 years', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      await investmentsPage.goToSubTab('Calculator');
      await investmentsPage.setCalculatorAmount(10000);

      // Drag slider to 2 years and count X ticks
      await investmentsPage.calculatorTimeHorizonSlider.fill('2');
      await investmentsPage.calculatorTimeHorizonSlider.dispatchEvent('input');
      await expect(investmentsPage.calculatorAreaChart).toBeVisible();
      const twoYearTicks = page.locator('.recharts-xAxis .recharts-cartesian-axis-tick-value');
      const twoCount = await twoYearTicks.count();

      // Drag slider to 10 years and count again
      await investmentsPage.calculatorTimeHorizonSlider.fill('10');
      await investmentsPage.calculatorTimeHorizonSlider.dispatchEvent('input');
      const tenCount = await twoYearTicks.count();

      expect(tenCount).toBeGreaterThan(twoCount);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Portfolio Builder sub-tab
  // ──────────────────────────────────────────────────────────────

  test.describe('Portfolio Builder', () => {
    test('Portfolio Builder sub-tab renders sliders for each fund', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      await investmentsPage.goToSubTab('Portfolio Builder');

      // There are 6 funds — expect 6 allocation sliders
      await expect(investmentsPage.portfolioSliders).toHaveCount(6);
    });

    test('setting two sliders so total equals 100% turns the total label green', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      await investmentsPage.goToSubTab('Portfolio Builder');

      // Allocate 60% to the first fund and 40% to the second — total = 100%
      await investmentsPage.setPortfolioSlider(0, 60);
      await investmentsPage.setPortfolioSlider(1, 40);

      // Total label must turn green (valid state)
      await expect(investmentsPage.portfolioTotalLabel).toHaveClass(/text-emerald-/);
    });

    test('a 100% valid allocation renders the donut chart', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      await investmentsPage.goToSubTab('Portfolio Builder');

      // Give one fund 100% — a valid single-fund allocation
      await investmentsPage.setPortfolioSlider(0, 100);

      // The donut chart must be visible with a real allocation
      await expect(investmentsPage.portfolioDonutChart).toBeVisible();
    });

    test('a valid allocation displays the blended annual return below the sliders', async ({ page }) => {
      const investmentsPage = new PageFactory(page).investments();

      await investmentsPage.goToSubTab('Portfolio Builder');
      await investmentsPage.setPortfolioSlider(0, 50);
      await investmentsPage.setPortfolioSlider(1, 50);

      // The blended return must be displayed as a percentage value
      const blendedReturn = page.getByText(/Blended.*Return|blended.*return/i);
      await expect(blendedReturn).toBeVisible();
    });
  });
});
