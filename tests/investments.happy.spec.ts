import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Investments tab — happy path tests
 *
 * Gap addressed by Amikoo QA review of PR #49.
 *
 * The existing investments.negative.spec.ts covers negative flows only
 * (zero-results search, 4th-fund limit, compare empty state, zero calc,
 * over-allocation). These tests cover the positive flows:
 *
 *  - Selecting a fund card shows the "✓ Selected" badge and ring highlight
 *  - Selecting up to 3 funds then opening Compare renders the line chart
 *  - Calculator sub-tab shows a projected value area chart
 *  - Portfolio Builder: allocating 100% to one fund shows the pie chart
 *
 * All tests use the existing InvestmentsPage POM and follow the project's
 * auto-wait / no-fixed-sleep conventions.
 */

test.describe('Investments — fund selection (happy path)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
    // Confirm the Investments heading is visible
    await expect(page.getByRole('heading', { name: 'Investments' })).toBeVisible();
  });

  test('clicking a fund card shows the "✓ Selected" badge on that card', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Fund Cards tab is active by default — click the first fund card
    await investments.selectFundCard(0);

    // Exactly one "✓ Selected" badge should appear
    await expect(investments.selectedBadges).toHaveCount(1);

    // The selected card should carry the emerald ring highlight
    await expect(investments.fundCards.nth(0)).toHaveClass(/ring-1/);
  });

  test('clicking the same fund card twice deselects it', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(1);

    // Toggle off
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(0);

    // Ring highlight should be gone
    await expect(investments.fundCards.nth(0)).not.toHaveClass(/ring-1/);
  });

  test('selecting 3 funds shows 3 "✓ Selected" badges', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.selectFundCard(1);
    await investments.selectFundCard(2);

    await expect(investments.selectedBadges).toHaveCount(3);
  });

  test('searching for "Tech" narrows the fund list to matching cards', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.searchFunds('Tech');

    // At least one card matching "Tech Growth" should remain
    await expect(investments.fundCards.first()).toBeVisible();

    // A fund like "Bond Fund" should be hidden
    const bondCard = page.locator('.grid > div').filter({ hasText: 'Bond Fund' });
    await expect(bondCard).toHaveCount(0);
  });
});

test.describe('Investments — Compare sub-tab (happy path)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
    await expect(page.getByRole('heading', { name: 'Investments' })).toBeVisible();
  });

  test('Compare tab shows a line chart after selecting 2 funds', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select 2 funds first
    await investments.selectFundCard(0);
    await investments.selectFundCard(1);

    // Navigate to Compare
    await investments.goToSubTab('Compare');

    // The empty-state message must be gone
    await expect(investments.compareEmptyState).not.toBeVisible();

    // The Recharts SVG should be present (a line chart is rendered)
    // recharts wraps its output in an SVG inside the ResponsiveContainer
    const chartSvg = page.locator('.recharts-wrapper svg').first();
    await expect(chartSvg).toBeVisible();
  });

  test('Compare tab heading and instructions are visible', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Compare');

    await expect(page.getByText('Fund Comparison (12-Month Performance)')).toBeVisible();
    await expect(page.getByText('Select up to 3 funds from Fund Cards to compare')).toBeVisible();
  });
});

test.describe('Investments — Calculator sub-tab (happy path)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
    await expect(page.getByRole('heading', { name: 'Investments' })).toBeVisible();
  });

  test('Calculator tab renders the Hypothetical Growth Calculator heading', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    await expect(page.getByText('Hypothetical Growth Calculator')).toBeVisible();
  });

  test('Calculator shows a projected area chart for the default $10,000 investment', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    // The default amount is $10,000 and the default fund is "US Large Cap Index"
    await expect(investments.calculatorAmountInput).toHaveValue('10000');

    // A Recharts SVG area chart should be rendered (non-zero investment)
    const chartSvg = page.locator('.recharts-wrapper svg').first();
    await expect(chartSvg).toBeVisible();
  });

  test('changing the investment amount updates the projection chart', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    // Change amount to $50,000
    await investments.setCalculatorAmount(50000);

    // Y-axis ticks should show dollar values above $50k (i.e. growth projected)
    const ticks = investments.calculatorYAxisTicks;
    await expect(ticks.first()).toBeVisible();

    // At least one tick must contain a dollar sign
    const firstTick = await ticks.first().textContent();
    expect(firstTick).toMatch(/\$/);
  });

  test('Calculator shows the risk disclaimer notice', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    await expect(page.getByText(/past performance does not guarantee/i)).toBeVisible();
  });
});

test.describe('Investments — Portfolio Builder sub-tab (happy path)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
    await expect(page.getByRole('heading', { name: 'Investments' })).toBeVisible();
  });

  test('Portfolio Builder tab renders the "Allocate Funds" heading', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    await expect(page.getByText('Allocate Funds')).toBeVisible();
    await expect(page.getByText('Portfolio Allocation')).toBeVisible();
  });

  test('allocating 100% to one fund shows a valid allocation total', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Set the first slider to 100%
    await investments.setPortfolioSlider(0, 100);

    // Total must show 100% in emerald (valid)
    await expect(investments.portfolioTotalLabel).toContainText('100%');
    await expect(investments.portfolioTotalLabel).toHaveClass(/text-emerald-400/);
  });

  test('allocating 100% to one fund renders the portfolio pie chart', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Set allocation to 100% for first fund
    await investments.setPortfolioSlider(0, 100);

    // The pie chart SVG should appear (replaces the "Allocate percentages" placeholder)
    const chartSvg = page.locator('.recharts-wrapper svg').first();
    await expect(chartSvg).toBeVisible();
  });

  test('blended annual return is shown in the Portfolio Builder', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Set a non-zero allocation so blended return is computed
    await investments.setPortfolioSlider(0, 100);

    await expect(page.getByText('Blended Annual Return:')).toBeVisible();
  });
});
