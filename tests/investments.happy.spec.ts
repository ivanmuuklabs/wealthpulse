import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Investments tab.
 *
 * Negative tests already exist in `investments.negative.spec.ts` (in main).
 * This file fills the missing happy-path coverage:
 *
 *  1. All 6 fund cards are visible with risk badges.
 *  2. Selecting a fund card marks it with "✓ Selected".
 *  3. Up to 3 funds can be selected simultaneously.
 *  4. Compare tab shows a line chart when at least one fund is selected.
 *  5. Calculator tab: pre-filled with $10,000 and renders a projection chart.
 *  6. Calculator shows the past-performance disclaimer.
 *  7. Portfolio Builder shows 6 allocation sliders.
 *  8. Portfolio Builder turns the total label green at exactly 100%.
 *  9. Searching for a fund by name narrows the displayed cards.
 * 10. Clearing the fund search restores all 6 cards.
 */

test.describe('Investments — happy path', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.investments().navigate();
    await expect(page.getByRole('heading', { name: 'Investments' })).toBeVisible();
    // Ensure we start on the Fund Cards sub-tab
    await page.getByRole('button', { name: 'Fund Cards' }).click();
  });

  // AC 1 — All 6 fund cards render with risk badges
  test('all 6 fund cards are visible and each shows a risk badge', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await expect(investments.fundCards).toHaveCount(6);

    // Each card must display one of the three risk levels
    const riskBadgePattern = /Low|Medium|High/;
    for (let i = 0; i < 6; i++) {
      const cardText = await investments.fundCards.nth(i).textContent();
      expect(cardText).toMatch(riskBadgePattern);
    }
  });

  // AC 2 — Selecting a fund marks it with "✓ Selected"
  test('clicking a fund card marks it as selected', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);

    await expect(investments.selectedBadges).toHaveCount(1);
    await expect(investments.fundCards.nth(0).getByText('✓ Selected')).toBeVisible();
  });

  // AC 3 — Up to 3 funds can be selected simultaneously
  test('selecting 3 fund cards shows 3 selected badges', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.selectFundCard(1);
    await investments.selectFundCard(2);

    await expect(investments.selectedBadges).toHaveCount(3);
  });

  // AC 4 — Compare tab shows a chart when one fund is selected
  test('Compare tab renders a line chart after selecting a fund', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select one fund, then switch to Compare
    await investments.selectFundCard(0);
    await investments.goToSubTab('Compare');

    // The compare heading must be visible and a chart container rendered
    await expect(page.getByRole('heading', { name: /Fund Comparison/i })).toBeVisible();
    // Recharts renders an SVG — at least one path element inside the chart area
    await expect(page.locator('.recharts-line')).toBeVisible({ timeout: 5000 });
  });

  // AC 5 — Calculator pre-fills with $10,000 and renders a projection chart
  test('Calculator tab shows $10,000 pre-filled and renders the projection chart', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    // Default investment amount is 10,000
    await expect(investments.calculatorAmountInput).toHaveValue('10000');

    // Chart should render (SVG path from the AreaChart)
    await expect(page.locator('.recharts-area')).toBeVisible({ timeout: 5000 });
  });

  // AC 6 — Calculator shows the past-performance disclaimer
  test('Calculator tab shows the past-performance disclaimer', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    await expect(page.getByText(/past performance does not guarantee future results/i)).toBeVisible();
  });

  // AC 7 — Portfolio Builder shows 6 allocation sliders (one per fund)
  test('Portfolio Builder tab shows 6 allocation sliders', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    await expect(investments.portfolioSliders).toHaveCount(6);
  });

  // AC 8 — Portfolio total label turns green at exactly 100%
  test('Portfolio Builder total label is green when all allocations sum to 100%', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Set first slider to 100% so the total is exactly 100
    await investments.setPortfolioSlider(0, 100);

    // The total label must contain "100%" and use the emerald colour
    const totalLabel = page.getByText(/Total:\s*100%/).first();
    await expect(totalLabel).toBeVisible();
    await expect(totalLabel).toHaveClass(/text-emerald-400/);
  });

  // AC 9 — Searching for a fund name narrows displayed cards
  test('searching for "Bond" shows only the Bond Fund card', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.searchFunds('Bond');

    await expect(investments.fundCards).toHaveCount(1);
    await expect(investments.fundCards.first().getByText('Bond Fund')).toBeVisible();
  });

  // AC 10 — Clearing the fund search restores all 6 cards
  test('clearing the fund search restores all 6 fund cards', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.searchFunds('Tech');
    await expect(investments.fundCards).toHaveCount(1);

    // Clear by emptying the input
    await investments.searchInput.clear();

    await expect(investments.fundCards).toHaveCount(6);
  });
});
