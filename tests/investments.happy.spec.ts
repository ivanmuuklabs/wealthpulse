import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

// Investments happy-path tests
// Covers: fund search, fund card selection, Compare tab chart, Calculator projection,
//         Portfolio Builder 100% allocation and donut chart

test.describe('Investments — happy path', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const investments = factory.investments();
    await investments.navigate();
  });

  // ----- Fund Cards sub-tab -----

  test('all six fund cards are visible on the Fund Cards sub-tab', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Each fund card contains "Expense Ratio" text — there are 6 seeded funds
    await expect(investments.fundCards).toHaveCount(6);
  });

  test('searching by fund name filters the displayed fund cards', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // "Growth" should match at least one fund (e.g. Global Growth Fund)
    await investments.searchFunds('Growth');

    const count = await investments.fundCards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(6);
  });

  test('selecting a fund card marks it as selected', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Click the first fund card
    await investments.selectFundCard(0);

    // The selected badge should appear exactly once
    await expect(investments.selectedBadges).toHaveCount(1);
  });

  test('selecting two funds shows two selected badges', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.selectFundCard(1);

    await expect(investments.selectedBadges).toHaveCount(2);
  });

  test('deselecting a fund removes its selected badge', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select then deselect the first card
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(1);

    await investments.selectFundCard(0); // click again to deselect
    await expect(investments.selectedBadges).toHaveCount(0);
  });

  // ----- Compare sub-tab -----

  test('Compare tab renders a chart when at least one fund is selected', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select two funds before switching to Compare
    await investments.selectFundCard(0);
    await investments.selectFundCard(1);

    await investments.goToSubTab('Compare');

    // The comparison chart should be visible and the empty-state should not
    await expect(investments.comparisonChart).toBeVisible();
    await expect(investments.compareEmptyState).not.toBeVisible();
  });

  // ----- Calculator sub-tab -----

  test('Calculator renders a chart for a valid investment amount', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    // Enter a valid investment of $1,000
    await investments.setCalculatorAmount(1000);

    // The area chart should be present (Recharts renders an SVG)
    const chart = page.locator('.recharts-area-chart, .recharts-responsive-container');
    await expect(chart.first()).toBeVisible();

    // Y-axis ticks should show non-zero dollar values
    const ticks = await investments.calculatorYAxisTicks.allTextContents();
    const hasNonZero = ticks.some(t => {
      const val = parseFloat(t.replace(/[$,k]/g, ''));
      return val > 0;
    });
    expect(hasNonZero).toBe(true);
  });

  // ----- Portfolio Builder sub-tab -----

  test('Portfolio Builder total turns green when allocation sums to exactly 100%', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Set the first slider to 100% — total becomes 100%
    await investments.setPortfolioSlider(0, 100);

    // All other sliders should be at 0 by default; total is exactly 100
    await expect(investments.portfolioTotalLabel).toHaveClass(/text-green-400/);
    await expect(investments.portfolioTotalLabel).toContainText('100%');
  });

  test('Portfolio Builder donut chart is visible when any allocation is set', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Set the first fund to 50%
    await investments.setPortfolioSlider(0, 50);

    // A Recharts donut/pie SVG should render
    const donut = page.locator('.recharts-pie');
    await expect(donut).toBeVisible();
  });

});
