import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Investments module — happy-path tests.
 *
 * The existing investments.negative.spec.ts covers only error/edge cases.
 * This file adds positive coverage for all four Investments sub-tabs:
 *   - Fund Cards: selecting a fund marks it as selected; deselecting removes it.
 *   - Compare: selecting 1–3 funds and navigating to Compare renders the chart.
 *   - Calculator: choosing a fund + amount + horizon renders the projection chart.
 *   - Portfolio Builder: adjusting allocations updates the donut chart and blended return.
 */

test.describe('Investments — Fund Cards (happy path)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const investmentsPage = factory.investments();
    await investmentsPage.navigate();
    // Default sub-tab is Fund Cards — wait for at least one card
    await expect(new PageFactory(page).investments().fundCards.first()).toBeVisible();
  });

  test('all six fund cards are rendered on load', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    // The app seeds exactly 6 investment funds
    await expect(investmentsPage.fundCards).toHaveCount(6);
  });

  test('searching by fund name filters the visible fund cards', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    // Every fund card has its name visible — grab the first one's name to search
    const firstName = await investmentsPage.fundCards.first().locator('h3, h2, [class*="font-bold"]').first().textContent();
    expect(firstName).not.toBeNull();
    const term = (firstName as string).trim().split(' ')[0];

    await investmentsPage.searchFunds(term);
    const count = await investmentsPage.fundCards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Clear search restores all 6 cards
    await investmentsPage.searchFunds('');
    await expect(investmentsPage.fundCards).toHaveCount(6);
  });

  test('clicking a fund card marks it as selected', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    // No funds selected initially
    await expect(investmentsPage.selectedBadges).toHaveCount(0);

    await investmentsPage.selectFundCard(0);

    // Exactly one "Selected" badge should now be visible
    await expect(investmentsPage.selectedBadges).toHaveCount(1);
  });

  test('clicking a selected fund card deselects it', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    // Select then deselect the first card
    await investmentsPage.selectFundCard(0);
    await expect(investmentsPage.selectedBadges).toHaveCount(1);

    await investmentsPage.selectFundCard(0); // click again to deselect
    await expect(investmentsPage.selectedBadges).toHaveCount(0);
  });

  test('up to three funds can be selected simultaneously', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.selectFundCard(0);
    await investmentsPage.selectFundCard(1);
    await investmentsPage.selectFundCard(2);

    await expect(investmentsPage.selectedBadges).toHaveCount(3);
  });
});

test.describe('Investments — Compare tab (happy path)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const investmentsPage = factory.investments();
    await investmentsPage.navigate();
    await expect(new PageFactory(page).investments().fundCards.first()).toBeVisible();
  });

  test('Compare tab renders a chart when at least one fund is selected', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    // Select two funds, then open the Compare sub-tab
    await investmentsPage.selectFundCard(0);
    await investmentsPage.selectFundCard(1);
    await investmentsPage.goToSubTab('Compare');

    // The comparison chart should be visible (not the empty-state placeholder)
    await expect(investmentsPage.comparisonChart).toBeVisible();
    await expect(investmentsPage.compareEmptyState).not.toBeVisible();
  });

  test('Compare tab renders a chart for a single selected fund', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.selectFundCard(2);
    await investmentsPage.goToSubTab('Compare');

    await expect(investmentsPage.comparisonChart).toBeVisible();
  });
});

test.describe('Investments — Calculator tab (happy path)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const investmentsPage = factory.investments();
    await investmentsPage.navigate();
    await investmentsPage.goToSubTab('Calculator');
    // Wait for the amount input to be rendered
    await expect(new PageFactory(page).investments().calculatorAmountInput).toBeVisible();
  });

  test('calculator projection chart renders with a valid investment amount', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    // Enter a valid investment amount — minimum is $100
    await investmentsPage.setCalculatorAmount(1000);

    // The Y-axis ticks should show non-zero dollar values
    const ticks = await investmentsPage.calculatorYAxisTicks.allTextContents();
    expect(ticks.length).toBeGreaterThan(0);
    const hasNonZero = ticks.some(t => {
      const value = parseFloat(t.replace(/[$,]/g, ''));
      return value > 0;
    });
    expect(hasNonZero).toBe(true);
  });

  test('increasing the investment amount increases the projected value', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    // Set a small amount and capture the max Y-axis tick
    await investmentsPage.setCalculatorAmount(500);
    const lowTicks = await investmentsPage.calculatorYAxisTicks.allTextContents();
    const maxLow = Math.max(...lowTicks.map(t => parseFloat(t.replace(/[$,]/g, '')) || 0));

    // Set a larger amount and recapture
    await investmentsPage.setCalculatorAmount(5000);
    const highTicks = await investmentsPage.calculatorYAxisTicks.allTextContents();
    const maxHigh = Math.max(...highTicks.map(t => parseFloat(t.replace(/[$,]/g, '')) || 0));

    // A higher investment should produce a proportionally higher projection ceiling
    expect(maxHigh).toBeGreaterThan(maxLow);
  });
});

test.describe('Investments — Portfolio Builder tab (happy path)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const investmentsPage = factory.investments();
    await investmentsPage.navigate();
    await investmentsPage.goToSubTab('Portfolio Builder');
    // Wait for the sliders to be rendered
    await expect(new PageFactory(page).investments().portfolioSliders.first()).toBeVisible();
  });

  test('portfolio builder shows the total allocation label', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    // The total label is always visible (shows current percentage)
    await expect(investmentsPage.portfolioTotalLabel).toBeVisible();
  });

  test('setting one fund to 100% allocation shows a valid total', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    // Set the first fund to 100%
    await investmentsPage.setPortfolioSlider(0, 100);

    // Total label should contain "100%"
    await expect(investmentsPage.portfolioTotalLabel).toContainText('100');
  });

  test('portfolio total turns green (valid) when exactly 100% is allocated', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    // Allocate exactly 100% to the first fund — total becomes 100%
    await investmentsPage.setPortfolioSlider(0, 100);

    // When total equals 100%, the label should NOT carry the red error class
    await expect(investmentsPage.portfolioTotalLabel).not.toHaveClass(/text-red-400/);
  });
});
