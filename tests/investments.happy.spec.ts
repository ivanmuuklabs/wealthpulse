import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Investments — happy-path tests
 *
 * User story: "As a user I can browse investment funds, compare their
 * performance, project hypothetical growth, and build a portfolio
 * allocation — all without leaving the Investments section."
 *
 * These tests cover the primary success scenarios (Fund Cards, Compare,
 * Calculator, and Portfolio Builder sub-tabs). Negative / edge-case paths
 * are in investments.negative.spec.ts.
 */

test.describe('Investments — Fund Cards', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
  });

  test('Investments section shows all 6 fund cards by default', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    // All 6 seeded funds have an expense ratio, so all 6 cards should be visible
    await expect(investmentsPage.fundCards).toHaveCount(6);
  });

  test('each fund card shows a risk badge (Low / Medium / High)', async ({ page }) => {
    // At least one card should carry each risk level visible in the seeded data
    await expect(page.getByText('Low').first()).toBeVisible();
    await expect(page.getByText('Medium').first()).toBeVisible();
    await expect(page.getByText('High').first()).toBeVisible();
  });

  test('searching for "Tech" narrows the list to 1 fund card', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.searchFunds('Tech');

    // Only "Tech Growth" should remain
    await expect(investmentsPage.fundCards).toHaveCount(1);
    await expect(page.getByText('Tech Growth')).toBeVisible();
  });

  test('searching for "Index" returns exactly 1 fund (US Large Cap Index)', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.searchFunds('Index');

    await expect(investmentsPage.fundCards).toHaveCount(1);
    await expect(page.getByText('US Large Cap Index')).toBeVisible();
  });

  test('selecting a fund card marks it as selected (ring + ✓ Selected badge)', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    // Select the first fund card
    await investmentsPage.selectFundCard(0);

    // Exactly one badge should appear
    await expect(investmentsPage.selectedBadges).toHaveCount(1);

    // The card should carry the ring highlight class
    await expect(investmentsPage.fundCards.first()).toHaveClass(/ring-1/);
  });

  test('selecting the same fund card twice deselects it', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    // Toggle on
    await investmentsPage.selectFundCard(0);
    await expect(investmentsPage.selectedBadges).toHaveCount(1);

    // Toggle off
    await investmentsPage.selectFundCard(0);
    await expect(investmentsPage.selectedBadges).toHaveCount(0);
  });

  test('up to 3 funds can be selected simultaneously', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.selectFundCard(0);
    await investmentsPage.selectFundCard(1);
    await investmentsPage.selectFundCard(2);

    await expect(investmentsPage.selectedBadges).toHaveCount(3);
  });

  test('clearing the search field restores all 6 fund cards', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.searchFunds('Bond');
    await expect(investmentsPage.fundCards).toHaveCount(1);

    // Clear the search
    await investmentsPage.searchInput.clear();
    await expect(investmentsPage.fundCards).toHaveCount(6);
  });
});

test.describe('Investments — Compare sub-tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
  });

  test('selecting 2 funds and opening Compare shows the comparison chart', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.selectFundCard(0);
    await investmentsPage.selectFundCard(1);
    await investmentsPage.goToSubTab('Compare');

    // Chart should be visible when at least 1 fund is selected
    await expect(investmentsPage.comparisonChart).toBeVisible();

    // Empty state must NOT be shown
    await expect(investmentsPage.compareEmptyState).not.toBeVisible();
  });

  test('Compare tab heading reads "Fund Comparison (12-Month Performance)"', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.goToSubTab('Compare');

    await expect(
      page.getByText('Fund Comparison (12-Month Performance)')
    ).toBeVisible();
  });
});

test.describe('Investments — Calculator sub-tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
  });

  test('Calculator sub-tab renders with a default investment amount', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.goToSubTab('Calculator');

    // Investment ($) input should be visible and pre-filled with 10000
    await expect(investmentsPage.calculatorAmountInput).toBeVisible();
    await expect(investmentsPage.calculatorAmountInput).toHaveValue('10000');
  });

  test('changing investment amount updates the Y-axis values above $0', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.goToSubTab('Calculator');
    await investmentsPage.setCalculatorAmount(50000);

    // Y-axis ticks should contain dollar-formatted values above $0
    const ticks = await investmentsPage.calculatorYAxisTicks.allTextContents();
    const hasNonZero = ticks.some(t => {
      const num = parseFloat(t.replace(/[$,]/g, ''));
      return num > 0;
    });
    expect(hasNonZero).toBe(true);
  });

  test('calculator shows the disclaimer about past performance', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.goToSubTab('Calculator');

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
    await factory.investments().navigate();
  });

  test('Portfolio Builder renders 6 sliders (one per fund)', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.goToSubTab('Portfolio Builder');

    await expect(investmentsPage.portfolioSliders).toHaveCount(6);
  });

  test('portfolio total shows "0%" with a red label when no allocation is set', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.goToSubTab('Portfolio Builder');

    // Default allocations are 0%, so total = 0 which is not 100 → red label
    await expect(investmentsPage.portfolioTotalLabel).toHaveClass(/text-red-400/);
  });

  test('setting all allocation to one fund at 100% shows green Total label', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.goToSubTab('Portfolio Builder');

    // Set first slider to 100, leave others at 0
    await investmentsPage.setPortfolioSlider(0, 100);

    // Total = 100% → should be emerald (green)
    await expect(investmentsPage.portfolioTotalLabel).toHaveClass(/text-emerald-400/);
    await expect(investmentsPage.portfolioTotalLabel).toContainText('100%');
  });

  test('setting a non-zero allocation shows the portfolio pie chart', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.goToSubTab('Portfolio Builder');
    await investmentsPage.setPortfolioSlider(0, 60);
    await investmentsPage.setPortfolioSlider(1, 40);

    // Pie chart should render (the "Allocate percentages to see chart" empty state disappears)
    await expect(
      page.getByText('Allocate percentages to see chart')
    ).not.toBeVisible();
  });
});
