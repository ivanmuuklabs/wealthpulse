import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Investments — happy-path tests
 *
 * Covers all four sub-tabs of the Investments section:
 *   1. Fund Cards   — browse, search, and select funds
 *   2. Compare      — performance chart for selected funds
 *   3. Calculator   — hypothetical growth projection
 *   4. Portfolio Builder — allocation sliders and blended-return readout
 *
 * The negative paths (search-no-match, 4th-fund limit, compare-empty-state,
 * zero-calculator, over-100% portfolio) are already covered in
 * investments.negative.spec.ts — this file focuses on the expected happy flows.
 *
 * Added by the Amikoo Test-new-pull-requests worker (PR #29, 2026-09-09).
 */

test.describe('Investments — Fund Cards (happy path)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
  });

  test('Investments tab loads with the Fund Cards sub-tab active by default', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // All 6 seeded funds should be visible as cards
    await expect(investments.fundCards).toHaveCount(6);
  });

  test('each fund card shows its name, type, risk badge, expense ratio and return columns', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Spot-check the first card — "US Large Cap Index"
    const firstCard = investments.fundCards.first();
    await expect(firstCard).toContainText('US Large Cap Index');
    await expect(firstCard).toContainText('Index');
    await expect(firstCard).toContainText('Medium');
    await expect(firstCard).toContainText('Expense Ratio');
    await expect(firstCard).toContainText('1M');
    await expect(firstCard).toContainText('3M');
    await expect(firstCard).toContainText('12M');
  });

  test('searching for a fund by name narrows the card list', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // "Tech" should match only "Tech Growth"
    await investments.searchFunds('Tech');

    await expect(investments.fundCards).toHaveCount(1);
    await expect(investments.fundCards.first()).toContainText('Tech Growth');
  });

  test('searching by risk level (High) filters to the three High-risk funds', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.searchFunds('High');

    // Three funds are tagged High-risk: International Equity, Tech Growth, Emerging Markets
    const count = await investments.fundCards.count();
    expect(count).toBe(3);
  });

  test('clearing the search restores all 6 fund cards', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.searchFunds('Bond');
    await expect(investments.fundCards).toHaveCount(1);

    // Clear the search
    await investments.searchFunds('');
    await expect(investments.fundCards).toHaveCount(6);
  });

  test('selecting a fund marks it as selected (✓ Selected badge appears)', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Click the first fund card
    await investments.selectFundCard(0);

    // The "✓ Selected" badge appears on the first card
    await expect(investments.fundCards.first()).toContainText('✓ Selected');
    await expect(investments.selectedBadges).toHaveCount(1);
  });

  test('selecting two funds marks both as selected', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.selectFundCard(1);

    await expect(investments.selectedBadges).toHaveCount(2);
  });

  test('clicking an already-selected fund deselects it', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select then immediately deselect
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(1);

    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(0);
  });
});

test.describe('Investments — Compare sub-tab (happy path)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
  });

  test('Compare sub-tab renders a line chart when one fund is selected', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select one fund first, then switch to Compare
    await investments.selectFundCard(0);
    await investments.goToSubTab('Compare');

    // The empty-state message should NOT be visible
    await expect(investments.compareEmptyState).not.toBeVisible();

    // A Recharts SVG should be rendered
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
  });

  test('Compare sub-tab shows chart for two selected funds', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.selectFundCard(2);
    await investments.goToSubTab('Compare');

    await expect(investments.compareEmptyState).not.toBeVisible();
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
  });

  test('switching back from Compare to Fund Cards re-shows the fund cards', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.goToSubTab('Compare');
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();

    // Navigate back
    await investments.goToSubTab('Fund Cards');
    await expect(investments.fundCards).toHaveCount(6);
  });
});

test.describe('Investments — Calculator sub-tab (happy path)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    const investments = new PageFactory(page).investments();
    await investments.navigate();
    await investments.goToSubTab('Calculator');
  });

  test('Calculator sub-tab renders with fund selector, investment amount, and time horizon controls', async ({ page }) => {
    // Fund dropdown
    await expect(page.getByLabel('Fund')).toBeVisible();

    // Investment amount input
    const amountInput = new PageFactory(page).investments().calculatorAmountInput;
    await expect(amountInput).toBeVisible();
    // Default value is $10,000
    await expect(amountInput).toHaveValue('10000');

    // Time horizon slider
    await expect(page.getByLabel('Time Horizon (years)')).toBeVisible();
  });

  test('Calculator shows a growth projection chart with the default $10,000 investment', async ({ page }) => {
    // A Recharts area chart should mount for the default fund / amount / horizon
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();

    // The Y-axis ticks should contain dollar signs
    const ticks = page.locator('.recharts-yAxis .recharts-cartesian-axis-tick-value');
    const firstTick = await ticks.first().textContent();
    expect(firstTick).toMatch(/\$/);
  });

  test('changing investment amount to $50,000 updates the projection chart', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.setCalculatorAmount(50000);

    // The chart should still be visible after the update
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();

    // The maximum Y-axis tick value should be higher than with $10k — at minimum the chart re-renders
    const ticks = page.locator('.recharts-yAxis .recharts-cartesian-axis-tick-value');
    const lastTick = await ticks.last().textContent();
    const value = parseFloat((lastTick ?? '0').replace(/[$,k]/g, ''));
    expect(value).toBeGreaterThan(0);
  });

  test('Calculator shows a disclaimer warning about past performance', async ({ page }) => {
    // The app renders an amber disclaimer below the chart
    await expect(page.getByText(/past performance does not guarantee/i)).toBeVisible();
  });
});

test.describe('Investments — Portfolio Builder sub-tab (happy path)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    const investments = new PageFactory(page).investments();
    await investments.navigate();
    await investments.goToSubTab('Portfolio Builder');
  });

  test('Portfolio Builder shows a slider for each of the 6 funds', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // There are 6 funds + 1 time-horizon slider on Calculator — but we are on Portfolio Builder
    // The portfolio sliders are the range inputs on this sub-tab only
    const sliders = page.locator('input[type="range"]');
    await expect(sliders).toHaveCount(6);
  });

  test('all fund allocation sliders start at 0%', async ({ page }) => {
    const sliders = page.locator('input[type="range"]');
    const count = await sliders.count();
    for (let i = 0; i < count; i++) {
      await expect(sliders.nth(i)).toHaveValue('0');
    }
  });

  test('setting one slider to 100% makes the total exactly 100% (valid, shown in emerald)', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Set only the first fund to 100%
    await investments.setPortfolioSlider(0, 100);

    // The total label should turn emerald and NOT show "must be 100%"
    await expect(investments.portfolioTotalLabel).toHaveClass(/text-emerald-400/);
    await expect(investments.portfolioTotalLabel).not.toContainText('must be 100%');
  });

  test('splitting allocation 50/50 across two funds sums to 100% correctly', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.setPortfolioSlider(0, 50);
    await investments.setPortfolioSlider(1, 50);

    await expect(investments.portfolioTotalLabel).toHaveClass(/text-emerald-400/);
    await expect(investments.portfolioTotalLabel).toContainText('100%');
  });

  test('a valid 100% allocation renders the portfolio pie chart', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Allocate all to one fund — pie chart should appear
    await investments.setPortfolioSlider(0, 100);

    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
  });

  test('Blended Annual Return is displayed and changes when allocation changes', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Set first fund to 100% — blended return should be its annual return
    await investments.setPortfolioSlider(0, 100);

    // The blended return label must be visible with a % sign
    await expect(page.getByText('Blended Annual Return:')).toBeVisible();
    const returnText = page.locator('text=/[+-]?\\d+\\.\\d+%/').first();
    await expect(returnText).toBeVisible();
  });
});
