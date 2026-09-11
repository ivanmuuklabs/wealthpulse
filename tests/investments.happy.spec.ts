import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Investments / Fund Explorer tab.
 *
 * Coverage gap addressed: the existing investments suite only covers negative
 * cases (no-match search, 4th-fund selection limit, Compare empty state,
 * zero-amount calculator, over-100% portfolio). This spec covers the primary
 * happy paths that users hit on every visit.
 *
 * Existing page object (InvestmentsPage.ts) is reused throughout.
 */

test.describe('Investments — Fund Explorer happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Investments tab
    const investments = factory.investments();
    await investments.navigate();

    // Confirm we are on the Fund Cards sub-tab (default)
    await expect(page.getByRole('heading', { name: /investments/i })).toBeVisible();
  });

  // ─── Test 1: All 6 fund cards load ──────────────────────────────────────
  test('all 6 fund cards are visible by default', async ({ page }) => {
    const investments = new PageFactory(page).investments();
    // The app seeds exactly 6 funds
    await expect(investments.fundCards).toHaveCount(6);
  });

  // ─── Test 2: Risk badges are present ─────────────────────────────────────
  test('fund cards display Low, Medium, and High risk badges', async ({ page }) => {
    // There must be at least one of each risk level rendered
    await expect(page.getByText('Low').first()).toBeVisible();
    await expect(page.getByText('Medium').first()).toBeVisible();
    await expect(page.getByText('High').first()).toBeVisible();
  });

  // ─── Test 3: Search narrows the list ─────────────────────────────────────
  test('searching by fund name narrows the card list', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // "Tech" should match only "Tech Growth"
    await investments.searchFunds('Tech');
    await expect(investments.fundCards).toHaveCount(1);
    await expect(page.getByText('Tech Growth')).toBeVisible();
  });

  // ─── Test 4: Clearing search restores all 6 cards ────────────────────────
  test('clearing the search input restores all 6 fund cards', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.searchFunds('Bond');
    await expect(investments.fundCards).toHaveCount(1);

    // Clear the search
    await investments.searchFunds('');
    await expect(investments.fundCards).toHaveCount(6);
  });

  // ─── Test 5: Selecting a fund toggles the Selected badge ─────────────────
  test('clicking a fund card toggles the "✓ Selected" badge', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // No cards selected initially
    await expect(investments.selectedBadges).toHaveCount(0);

    // Select the first card
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(1);

    // De-select by clicking again
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(0);
  });

  // ─── Test 6: Up to 3 funds can be selected simultaneously ─────────────────
  test('up to 3 funds can be selected at the same time', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.selectFundCard(1);
    await investments.selectFundCard(2);

    await expect(investments.selectedBadges).toHaveCount(3);
  });

  // ─── Test 7: Compare tab renders a chart when funds are selected ───────────
  test('Compare tab shows the comparison chart when funds are selected', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select 2 funds, then switch to Compare
    await investments.selectFundCard(0);
    await investments.selectFundCard(1);
    await investments.goToSubTab('Compare');

    // The empty-state message must be gone and the chart must be present
    await expect(investments.compareEmptyState).not.toBeVisible();
    await expect(investments.comparisonChart).toBeVisible();
  });

  // ─── Test 8: Calculator renders with default $10,000 ──────────────────────
  test('calculator pre-fills with $10,000 and shows a non-zero projection', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    // The amount input should default to 10000
    await expect(investments.calculatorAmountInput).toHaveValue('10000');

    // Y-axis ticks must contain at least one non-zero dollar value
    const ticks = await investments.calculatorYAxisTicks.allTextContents();
    const hasNonZero = ticks.some(t => {
      const num = parseFloat(t.replace(/[$,]/g, ''));
      return num > 0;
    });
    expect(hasNonZero).toBe(true);
  });

  // ─── Test 9: Portfolio Builder shows 6 sliders ────────────────────────────
  test('Portfolio Builder renders a slider for each of the 6 funds', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // One range input per fund
    await expect(investments.portfolioSliders).toHaveCount(6);
  });

  // ─── Test 10: 100% allocation turns the total label green ─────────────────
  test('setting 100% allocation on one fund makes the total label green', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Set the first slider to 100% — total allocation becomes 100%
    await investments.setPortfolioSlider(0, 100);

    // The Total label should now carry the emerald/green text class
    await expect(investments.portfolioTotalLabel).toHaveClass(/text-emerald-400/);
  });
});
