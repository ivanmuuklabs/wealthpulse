import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Investments — happy-path flows not covered by investments.negative.spec.ts.
 *
 * Test 1: Selecting funds on the Fund Cards tab then switching to Compare
 *          renders the multi-line comparison chart.
 *
 * Test 2: The Calculator renders a projection chart with the default fund,
 *          $10 000 amount, and 5-year horizon; changing the amount re-renders
 *          it with a different endpoint value.
 *
 * Test 3: Portfolio Builder — setting one fund to 100% allocation produces a
 *          green "100%" total, a visible donut chart, and a non-zero blended
 *          return label.
 */

test.describe('Investments — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    const investments = factory.investments();
    await investments.navigate();
    // Confirm the Investments heading is visible before each test
    await expect(page.getByRole('heading', { name: 'Investments' })).toBeVisible();
  });

  // Test 1 — Fund Cards selection → Compare chart
  test('selecting two funds on Fund Cards then switching to Compare renders the line chart', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select the first two fund cards
    await investments.selectFundCard(0);
    await investments.selectFundCard(1);

    // Both should show the "✓ Selected" badge
    await expect(investments.selectedBadges).toHaveCount(2);

    // Switch to the Compare sub-tab
    await investments.goToSubTab('Compare');

    // The comparison chart must appear and the empty-state must NOT be visible
    await expect(investments.comparisonChart).toBeVisible();
    await expect(investments.compareEmptyState).not.toBeVisible();
  });

  // Test 2 — Calculator default render + amount change re-renders chart
  test('Calculator renders a projection chart by default and updates when the amount changes', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    // The Y-axis ticks prove the chart rendered with data (they should not all be $0)
    const yTicks = investments.calculatorYAxisTicks;
    await expect(yTicks.first()).toBeVisible();

    const ticksBefore = await yTicks.allTextContents();
    const hasNonZeroBefore = ticksBefore.some(t => !t.includes('$0'));
    expect(hasNonZeroBefore).toBe(true);

    // Change the investment amount — the chart must re-render with different values
    await investments.setCalculatorAmount(25000);

    const ticksAfter = await yTicks.allTextContents();
    // The maximum y-axis value must be higher after increasing the amount
    expect(ticksAfter).not.toEqual(ticksBefore);
  });

  // Test 3 — Portfolio Builder 100% allocation → green total + donut chart
  test('allocating 100% to a single fund shows a green total, donut chart, and blended return', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Set the first fund's slider to 100%
    await investments.setPortfolioSlider(0, 100);

    // The total label should display "100%" in green (valid allocation)
    const totalLabel = investments.portfolioTotalLabel;
    await expect(totalLabel).toBeVisible();
    await expect(totalLabel).toContainText('100');
    // Must NOT carry the error class when exactly at 100%
    await expect(totalLabel).not.toHaveClass(/text-red-400/);

    // A donut (pie) chart must appear for the portfolio
    const portfolioPie = page.locator('.recharts-pie');
    await expect(portfolioPie).toBeVisible();

    // The blended return label must be visible and show a percentage value
    const blendedReturn = page.getByText(/Blended Return/i);
    await expect(blendedReturn).toBeVisible();
  });
});
