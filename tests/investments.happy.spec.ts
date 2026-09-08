import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Investments tab.
 *
 * User stories:
 *   - "As a user I can browse all 6 available investment funds and see their
 *     risk level, expense ratio, and 1M / 3M / 12M returns at a glance."
 *   - "As a user I can select up to 3 funds and compare their 12-month
 *     cumulative performance on a line chart."
 *   - "As a user I can run the Hypothetical Growth Calculator for any fund
 *     with a custom investment amount and time horizon."
 *   - "As a user I can build a custom portfolio by allocating percentages across
 *     funds and see the blended annual return when the total reaches exactly 100%."
 *
 * The existing investments.negative.spec.ts covers edge cases (search no-match,
 * 4-fund limit, empty compare state, zero-amount calculator, >100% portfolio).
 * These tests focus exclusively on the successful flows.
 */

test.describe('Investments — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
  });

  // ── Fund Cards ────────────────────────────────────────────────────────────

  test('Fund Cards tab shows exactly 6 investment funds on load', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // The app seeds 6 funds; all should be visible with no search applied
    await expect(investments.fundCards).toHaveCount(6);
  });

  test('each fund card displays risk level, expense ratio, and return periods', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    const firstCard = investments.fundCards.first();

    // Every card should show a risk badge (Low / Medium / High)
    await expect(firstCard.getByText(/Low|Medium|High/)).toBeVisible();

    // Every card should show "Expense Ratio:"
    await expect(firstCard.getByText(/Expense Ratio:/)).toBeVisible();

    // Every card should show the three return period labels
    await expect(firstCard.getByText('1M')).toBeVisible();
    await expect(firstCard.getByText('3M')).toBeVisible();
    await expect(firstCard.getByText('12M')).toBeVisible();
  });

  test('searching for "Index" filters down to the US Large Cap Index fund', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.searchFunds('Index');

    // Only the "US Large Cap Index" fund matches — exactly 1 card
    await expect(investments.fundCards).toHaveCount(1);
    await expect(page.getByText('US Large Cap Index')).toBeVisible();
  });

  test('clearing the search restores all 6 fund cards', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.searchFunds('Bond');
    // Narrowed to 1
    await expect(investments.fundCards).toHaveCount(1);

    // Clear search
    await investments.searchFunds('');
    await expect(investments.fundCards).toHaveCount(6);
  });

  test('selecting a fund marks it with the "✓ Selected" badge', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Before selection: no badges
    await expect(investments.selectedBadges).toHaveCount(0);

    // Select the first fund
    await investments.selectFundCard(0);

    // Exactly one badge should appear
    await expect(investments.selectedBadges).toHaveCount(1);
  });

  test('de-selecting a selected fund removes its "✓ Selected" badge', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select then de-select the first fund
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(1);

    await investments.selectFundCard(0); // second click deselects
    await expect(investments.selectedBadges).toHaveCount(0);
  });

  // ── Compare tab ───────────────────────────────────────────────────────────

  test('Compare tab shows the line chart when at least one fund is selected', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select one fund from Fund Cards, then navigate to Compare
    await investments.selectFundCard(0);
    await investments.goToSubTab('Compare');

    // The empty-state message should be gone
    await expect(investments.compareEmptyState).not.toBeVisible();

    // A Recharts SVG element confirming the chart rendered
    await expect(page.locator('.recharts-surface').first()).toBeVisible();
  });

  test('Compare tab shows lines for all 3 selected funds', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select 3 funds
    await investments.selectFundCard(0);
    await investments.selectFundCard(1);
    await investments.selectFundCard(2);
    await expect(investments.selectedBadges).toHaveCount(3);

    // Switch to Compare
    await investments.goToSubTab('Compare');

    // Each selected fund produces a line — there should be 3 legend items
    const legendItems = page.locator('.recharts-legend-item');
    await expect(legendItems).toHaveCount(3);
  });

  // ── Hypothetical Growth Calculator ────────────────────────────────────────

  test('Calculator sub-tab renders the projection chart with the default settings', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    // The chart area should be visible
    await expect(page.locator('.recharts-surface').first()).toBeVisible();

    // Y-axis ticks should contain dollar values (not all $0)
    const ticks = page.locator('.recharts-yAxis .recharts-cartesian-axis-tick-value');
    const tickTexts = await ticks.allTextContents();
    const hasNonZeroValue = tickTexts.some(t => !t.includes('$0') && t.startsWith('$'));
    expect(hasNonZeroValue).toBe(true);
  });

  test('changing the investment amount to $50,000 updates the calculator projection', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    // Read the top Y-axis tick before changing the amount (default $10,000)
    const getTopTick = async () => {
      const ticks = await page
        .locator('.recharts-yAxis .recharts-cartesian-axis-tick-value')
        .allTextContents();
      return ticks[ticks.length - 1] ?? '';
    };

    const before = await getTopTick();

    // Change to $50,000 — projection should grow proportionally
    await investments.setCalculatorAmount(50000);

    const after = await getTopTick();

    // The projected value must be higher with a larger initial investment
    const parseAmount = (t: string) => parseFloat(t.replace(/[$k,]/g, '')) * (t.includes('k') ? 1000 : 1);
    expect(parseAmount(after)).toBeGreaterThan(parseAmount(before));
  });

  test('the disclaimer note is visible in the Calculator tab', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    // The app renders a warning: "This is not financial advice."
    await expect(page.getByText(/This is not financial advice/)).toBeVisible();
  });

  // ── Portfolio Builder ─────────────────────────────────────────────────────

  test('Portfolio Builder sub-tab is accessible and shows the fund allocation sliders', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // 6 funds → 6 range sliders
    await expect(investments.portfolioSliders).toHaveCount(6);
  });

  test('setting two funds to 50% each produces a total of 100% (valid state)', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Allocate 50% to the first fund and 50% to the second
    await investments.setPortfolioSlider(0, 50);
    await investments.setPortfolioSlider(1, 50);

    // The total label should turn green and NOT show the "(must be 100%)" error
    await expect(investments.portfolioTotalLabel).toHaveClass(/text-emerald-400/);
    await expect(investments.portfolioTotalLabel).not.toContainText('must be 100%');
    await expect(investments.portfolioTotalLabel).toContainText('100%');
  });

  test('blended annual return is shown when portfolio totals 100%', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Give 100% to a single fund
    await investments.setPortfolioSlider(0, 100);

    // The blended return text should contain a percentage value
    const blendedLabel = page.getByText('Blended Annual Return:').locator('..');
    await expect(blendedLabel.locator('span').last()).toContainText(/%/);
  });

  test('the portfolio pie chart renders when at least one fund is allocated', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Allocate some percentage to the first fund
    await investments.setPortfolioSlider(0, 60);

    // The pie chart placeholder "Allocate percentages…" should disappear
    await expect(page.getByText('Allocate percentages to see chart')).not.toBeVisible();

    // A Recharts surface should be visible (the pie chart)
    await expect(page.locator('.recharts-surface').first()).toBeVisible();
  });
});
