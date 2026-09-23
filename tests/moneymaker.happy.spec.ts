import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the MoneyMaker (formerly Investments) section.
 *
 * PR #56 renamed the sidebar label and tab heading from "Investments" to
 * "MoneyMaker". The functional surface is unchanged, so these tests verify
 * the four positive flows that were not covered by any spec on this branch:
 *
 *   1. Fund card select / deselect (ring + badge lifecycle)
 *   2. Compare sub-tab: selecting funds then switching shows the line chart
 *   3. Calculator sub-tab: entering a positive amount produces a non-zero projection
 *   4. Portfolio Builder: setting sliders to exactly 100% turns the label green
 */

test.describe('MoneyMaker — fund card selection (happy path)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
    await expect(page.getByRole('heading', { name: 'MoneyMaker' })).toBeVisible();
  });

  test('selecting a fund card shows the ring highlight and "✓ Selected" badge', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // No cards should be selected initially
    await expect(investments.selectedBadges).toHaveCount(0);

    // Click the first card to select it
    await investments.selectFundCard(0);

    // The selected badge should now appear exactly once
    await expect(investments.selectedBadges).toHaveCount(1);

    // The first card should carry the selection ring class
    await expect(investments.fundCards.first()).toHaveClass(/ring-1/);
  });

  test('deselecting a fund card removes the ring highlight and badge', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select then deselect the first card
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(1);

    await investments.selectFundCard(0); // click again to toggle off
    await expect(investments.selectedBadges).toHaveCount(0);
    await expect(investments.fundCards.first()).not.toHaveClass(/ring-1/);
  });

  test('selecting up to 3 fund cards shows exactly 3 selected badges', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.selectFundCard(1);
    await investments.selectFundCard(2);

    await expect(investments.selectedBadges).toHaveCount(3);
  });
});

test.describe('MoneyMaker — Compare sub-tab happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
    await expect(page.getByRole('heading', { name: 'MoneyMaker' })).toBeVisible();
  });

  test('selecting one fund and switching to Compare renders the comparison chart', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select the first fund card
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(1);

    // Switch to the Compare sub-tab
    await investments.goToSubTab('Compare');

    // The chart should now be visible (at least one fund is selected)
    await expect(investments.comparisonChart).toBeVisible();

    // The empty-state message must NOT be shown
    await expect(investments.compareEmptyState).not.toBeVisible();
  });

  test('selecting two funds and switching to Compare renders the comparison chart', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.selectFundCard(1);

    await investments.goToSubTab('Compare');

    await expect(investments.comparisonChart).toBeVisible();
    await expect(investments.compareEmptyState).not.toBeVisible();
  });
});

test.describe('MoneyMaker — Calculator sub-tab happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
    await factory.investments().goToSubTab('Calculator');
    await expect(new PageFactory(page).investments().calculatorAmountInput).toBeVisible();
  });

  test('the Calculator input pre-fills with a positive default amount', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // The default value should be a non-empty, positive number (app seeds $10,000)
    const value = await investments.calculatorAmountInput.inputValue();
    expect(Number(value)).toBeGreaterThan(0);
  });

  test('entering a positive investment amount shows non-zero Y-axis projections', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Set a clear positive amount
    await investments.setCalculatorAmount(10000);

    // Y-axis ticks must be present
    await expect(investments.calculatorYAxisTicks.first()).toBeVisible();

    // At least one tick should show a non-$0 value — confirming a real projection is drawn
    const tickTexts = await investments.calculatorYAxisTicks.allTextContents();
    const hasNonZero = tickTexts.some(t => {
      const cleaned = t.replace(/[$,]/g, '');
      return parseFloat(cleaned) > 0;
    });
    expect(hasNonZero).toBe(true);
  });
});

test.describe('MoneyMaker — Portfolio Builder sub-tab happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
    await factory.investments().goToSubTab('Portfolio Builder');
    // Confirm the sliders are rendered before each test
    await expect(new PageFactory(page).investments().portfolioSliders.first()).toBeVisible();
  });

  test('setting the first slider to 100% shows the total label', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Allocate 100% to the first slider; all others should be 0 by default
    await investments.setPortfolioSlider(0, 100);

    // The total label should be visible
    await expect(investments.portfolioTotalLabel).toBeVisible();
  });

  test('portfolio total label turns green when allocation sums to exactly 100%', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Reset all sliders to 0 first, then allocate 100% to a single fund
    const count = await investments.portfolioSliders.count();
    for (let i = 0; i < count; i++) {
      await investments.setPortfolioSlider(i, 0);
    }
    await investments.setPortfolioSlider(0, 100);

    // At 100% total the label must be green (emerald), not red
    await expect(investments.portfolioTotalLabel).toHaveClass(/text-emerald-400/);
    await expect(investments.portfolioTotalLabel).not.toHaveClass(/text-red-400/);
  });
});
