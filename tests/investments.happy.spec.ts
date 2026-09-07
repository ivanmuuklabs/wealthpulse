import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Investments tab — happy path tests.
 *
 * The Investments module has four sub-tabs:
 *   1. Fund Cards  — browse/search 6 funds, select up to 3 for comparison
 *   2. Compare     — 12-month cumulative-return line chart for selected funds
 *   3. Calculator  — hypothetical growth projection given an amount and time horizon
 *   4. Portfolio Builder — allocate % across funds, view blended return and donut chart
 *
 * Negative tests (fund limit enforcement, compare empty-state, zero calculator
 * amount, over-100% allocation) are already covered in investments.negative.spec.ts.
 * This file covers the successful, expected-use flows only.
 */

test.describe('Investments — Fund Cards sub-tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
  });

  // All 6 seeded funds should be visible by default (no search applied)
  test('all six fund cards are visible when no search is applied', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await expect(investments.fundCards).toHaveCount(6);
  });

  // Searching by fund name narrows the displayed cards
  test('searching by "Growth" filters cards to only matching funds', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // "Growth" matches "Tech Growth" and "Global Growth Fund" — at least 1, fewer than 6
    await investments.searchFunds('Growth');

    const count = await investments.fundCards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(6);
  });

  // Clearing the search input restores all 6 fund cards
  test('clearing the fund search restores all six cards', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.searchFunds('Bond');
    const filtered = await investments.fundCards.count();
    expect(filtered).toBeLessThan(6);

    // Clear the search
    await investments.searchFunds('');
    await expect(investments.fundCards).toHaveCount(6);
  });

  // Clicking a fund card marks it as selected (✓ Selected badge appears)
  test('clicking a fund card marks it as selected', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);

    await expect(investments.selectedBadges).toHaveCount(1);
  });

  // Selecting two funds shows two selected badges
  test('selecting two different fund cards shows two selected badges', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.selectFundCard(1);

    await expect(investments.selectedBadges).toHaveCount(2);
  });

  // Clicking a selected card again deselects it
  test('clicking a selected fund card a second time deselects it', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(1);

    // Deselect
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(0);
  });

  // Each fund card displays its Expense Ratio — spot-check the first card
  test('fund cards display their Expense Ratio label', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // All 6 fund cards contain "Expense Ratio" text (used as the locator)
    const count = await investments.fundCards.count();
    expect(count).toBe(6);

    // The first card must visibly contain "Expense Ratio"
    await expect(investments.fundCards.first()).toContainText('Expense Ratio');
  });
});

test.describe('Investments — Compare sub-tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
  });

  // Selecting at least one fund then switching to Compare renders the chart
  test('Compare tab renders the line chart when one fund is selected', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.goToSubTab('Compare');

    // Chart is visible; empty-state is not
    await expect(investments.comparisonChart).toBeVisible();
    await expect(investments.compareEmptyState).not.toBeVisible();
  });

  // With 3 selected funds the chart and all 3 series must render
  test('Compare tab shows chart for three selected funds', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.selectFundCard(1);
    await investments.selectFundCard(2);
    await investments.goToSubTab('Compare');

    await expect(investments.comparisonChart).toBeVisible();
    await expect(investments.compareEmptyState).not.toBeVisible();

    // Three Recharts lines should be rendered in the SVG
    const lines = page.locator('.recharts-line');
    const lineCount = await lines.count();
    expect(lineCount).toBe(3);
  });
});

test.describe('Investments — Calculator sub-tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    const investments = factory.investments();
    await investments.navigate();
    await investments.goToSubTab('Calculator');
  });

  // Default amount ($10,000) produces a visible projection chart
  test('Calculator renders a projection chart with the default investment amount', async ({ page }) => {
    // The area chart SVG element must be present
    const chart = page.locator('.recharts-area');
    await expect(chart.first()).toBeVisible();
  });

  // Changing the investment amount updates the Y-axis ticks to non-zero values
  test('setting a $5,000 investment produces a chart with non-zero Y-axis ticks', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.setCalculatorAmount(5000);

    // Y-axis ticks should include dollar values above $0
    const ticks = await investments.calculatorYAxisTicks.allTextContents();
    const hasPositive = ticks.some(t => {
      const num = parseFloat(t.replace(/[$,k]/g, ''));
      return num > 0;
    });
    expect(hasPositive).toBe(true);
  });

  // The Calculator section shows the disclaimer warning text
  test('Calculator displays the past-performance disclaimer', async ({ page }) => {
    await expect(
      page.getByText(/past performance does not guarantee future results/i)
    ).toBeVisible();
  });
});

test.describe('Investments — Portfolio Builder sub-tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    const investments = factory.investments();
    await investments.navigate();
    await investments.goToSubTab('Portfolio Builder');
  });

  // All 6 sliders must render (one per fund)
  test('Portfolio Builder shows allocation sliders for all six funds', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await expect(investments.portfolioSliders).toHaveCount(6);
  });

  // Initial total is 0 %
  test('Portfolio Builder starts with 0% total allocation', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await expect(investments.portfolioTotalLabel).toContainText('0%');
  });

  // Setting one slider to 100 % turns the total label green
  test('setting a single fund to 100% shows green total label', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.setPortfolioSlider(0, 100);

    await expect(investments.portfolioTotalLabel).toContainText('100%');
    await expect(investments.portfolioTotalLabel).toHaveClass(/text-emerald-400/);
  });

  // Allocation above 0 renders a donut chart
  test('setting any allocation above 0% makes the donut chart appear', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.setPortfolioSlider(0, 50);

    const pie = page.locator('.recharts-pie');
    await expect(pie).toBeVisible();
  });

  // Over-100 % total turns the label red (red = invalid — edge-case caught here as positive verification)
  test('allocating two funds to 60% each shows a red total label (>100%)', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.setPortfolioSlider(0, 60);
    await investments.setPortfolioSlider(1, 60);

    await expect(investments.portfolioTotalLabel).toHaveClass(/text-red-400/);
    await expect(investments.portfolioTotalLabel).toContainText('must be 100%');
  });
});
