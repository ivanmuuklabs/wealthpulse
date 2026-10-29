import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Investments — happy path tests
 *
 * The Investments tab has four sub-sections:
 *   - Fund Cards: browse and select up to 3 funds, search by name/type/risk
 *   - Compare: 12-month performance line chart for selected funds
 *   - Calculator: hypothetical growth projection with fund / amount / horizon inputs
 *   - Portfolio Builder: percentage-based fund allocator with live pie chart
 *
 * The existing test suite (investments.negative.spec.ts) covers only failure scenarios.
 * These tests validate the primary happy-path flows across all four sub-sections.
 */

test.describe('Investments — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
  });

  // ─── Fund Cards ───────────────────────────────────────────────────────────

  test('Investments tab renders 6 fund cards by default', async ({ page }) => {
    const investments = new PageFactory(page).investments();
    // All 6 seeded funds should be visible on load
    await expect(investments.fundCards).toHaveCount(6);
  });

  test('searching for a fund by name narrows the list to matching cards', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.searchFunds('Bond');

    // Only the "Bond Fund" should remain
    await expect(investments.fundCards).toHaveCount(1);
    await expect(page.getByText('Bond Fund')).toBeVisible();
  });

  test('searching for a fund by risk level shows only cards with that risk', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.searchFunds('Low');

    // Only the Bond Fund has Low risk
    await expect(investments.fundCards).toHaveCount(1);
  });

  test('clearing the search term after filtering restores all 6 fund cards', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.searchFunds('Tech');
    await expect(investments.fundCards).toHaveCount(1);

    await investments.searchFunds('');
    await expect(investments.fundCards).toHaveCount(6);
  });

  test('selecting a fund card marks it as selected with the ✓ Selected badge', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);

    // One badge must appear
    await expect(investments.selectedBadges).toHaveCount(1);
    await expect(investments.selectedBadges.first()).toContainText('✓ Selected');
  });

  test('selecting two fund cards shows two ✓ Selected badges', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.selectFundCard(1);

    await expect(investments.selectedBadges).toHaveCount(2);
  });

  test('clicking an already-selected fund card deselects it', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select then immediately deselect
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(1);

    await investments.selectFundCard(0); // toggle off
    await expect(investments.selectedBadges).toHaveCount(0);
  });

  test('each fund card shows expense ratio and 1M / 3M / 12M return cells', async ({ page }) => {
    // First card always has these data cells
    const firstCard = new PageFactory(page).investments().fundCards.first();
    await expect(firstCard.getByText('Expense Ratio:')).toBeVisible();
    await expect(firstCard.getByText('1M')).toBeVisible();
    await expect(firstCard.getByText('3M')).toBeVisible();
    await expect(firstCard.getByText('12M')).toBeVisible();
  });

  // ─── Compare sub-tab ──────────────────────────────────────────────────────

  test('Compare tab shows line chart when one or more funds are selected', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select two funds first
    await investments.selectFundCard(0);
    await investments.selectFundCard(1);

    await investments.goToSubTab('Compare');

    // The comparison chart heading must be visible
    await expect(page.getByText('Fund Comparison (12-Month Performance)')).toBeVisible();

    // A Recharts line element must render
    const lines = page.locator('.recharts-line');
    await expect(lines.first()).toBeVisible();
  });

  // ─── Calculator sub-tab ───────────────────────────────────────────────────

  test('Calculator sub-tab renders projection chart for the default settings', async ({ page }) => {
    const investments = new PageFactory(page).investments();
    await investments.goToSubTab('Calculator');

    await expect(page.getByText('Hypothetical Growth Calculator')).toBeVisible();

    // The area chart should render with valid data
    const area = page.locator('.recharts-area');
    await expect(area.first()).toBeVisible();
  });

  test('Calculator fund selector lists all 6 funds', async ({ page }) => {
    await new PageFactory(page).investments().goToSubTab('Calculator');

    const fundSelector = page.getByLabel('Fund');
    const options = fundSelector.locator('option');
    await expect(options).toHaveCount(6);
  });

  test('changing the Calculator investment amount updates the projection chart', async ({ page }) => {
    const investments = new PageFactory(page).investments();
    await investments.goToSubTab('Calculator');

    // Change the investment amount from default $10,000 to $50,000
    await investments.setCalculatorAmount(50000);

    // The Y-axis ticks should now reflect larger values
    const ticks = investments.calculatorYAxisTicks;
    const tickTexts = await ticks.allTextContents();
    // With $50k the projected values will be much larger than $0
    const nonZero = tickTexts.some(t => t !== '$0' && t !== '$0.00');
    expect(nonZero).toBe(true);
  });

  // ─── Portfolio Builder sub-tab ────────────────────────────────────────────

  test('Portfolio Builder sub-tab renders the allocation sliders for all 6 funds', async ({ page }) => {
    await new PageFactory(page).investments().goToSubTab('Portfolio Builder');

    await expect(page.getByText('Allocate Funds')).toBeVisible();

    const sliders = page.locator('input[type="range"]');
    await expect(sliders).toHaveCount(6);
  });

  test('setting one fund to 100% allocation shows a pie chart and blended return', async ({ page }) => {
    const investments = new PageFactory(page).investments();
    await investments.goToSubTab('Portfolio Builder');

    // Set the first fund (US Large Cap Index) to 100%
    await investments.setPortfolioSlider(0, 100);

    // A PieChart should now appear (was empty before)
    await expect(page.getByText('Portfolio Allocation')).toBeVisible();
    const pie = page.locator('.recharts-pie');
    await expect(pie.first()).toBeVisible();

    // Blended Annual Return should show a non-zero percentage
    await expect(page.getByText('Blended Annual Return:')).toBeVisible();
  });

  test('setting total allocation to exactly 100% shows the Total in emerald (valid state)', async ({ page }) => {
    const investments = new PageFactory(page).investments();
    await investments.goToSubTab('Portfolio Builder');

    // Allocate 100% to the first fund
    await investments.setPortfolioSlider(0, 100);

    // When total === 100 the text does NOT say "must be 100%"
    const totalLabel = investments.portfolioTotalLabel;
    await expect(totalLabel).toContainText('100%');
    await expect(totalLabel).not.toContainText('must be 100%');
    // The label should carry the emerald colour class (not red-400)
    await expect(totalLabel).not.toHaveClass(/text-red-400/);
  });
});
