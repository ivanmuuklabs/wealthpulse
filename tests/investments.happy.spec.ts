import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Investments — happy-path tests.
 *
 * The existing investments.negative.spec.ts covers error flows (no-match search,
 * 4th-fund block, compare empty state, zero-amount calculator, over-100% portfolio).
 * This file adds the positive flows that were completely missing.
 */

test.describe('Investments — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    const investments = factory.investments();
    await investments.navigate();
  });

  /**
   * All 6 fund cards are visible on the default Fund Cards sub-tab.
   * Each card must show an Expense Ratio — the selector used by InvestmentsPage.
   */
  test('all 6 fund cards are visible after navigating to Investments', async ({ page }) => {
    const investments = new PageFactory(page).investments();
    await expect(investments.fundCards).toHaveCount(6);
  });

  /**
   * Clicking a fund card marks it as selected (shows the ✓ Selected badge).
   * Clicking it again deselects it (badge disappears).
   */
  test('clicking a fund card selects it and clicking again deselects it', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select the first fund
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(1);

    // Deselect it
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(0);
  });

  /**
   * Searching by fund name narrows the visible cards to matching results.
   * Clearing the search restores all 6 cards.
   */
  test('searching by fund name filters cards and clearing restores all 6', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // "Bond" should match exactly 1 fund
    await investments.searchFunds('Bond');
    await expect(investments.fundCards).toHaveCount(1);

    // Clearing the search input restores all 6
    await investments.searchFunds('');
    await expect(investments.fundCards).toHaveCount(6);
  });

  /**
   * Compare tab shows a chart when at least one fund is selected.
   * The empty-state message must no longer be visible.
   */
  test('Compare tab renders a chart when at least one fund is selected', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select a fund then switch to Compare
    await investments.selectFundCard(0);
    await investments.goToSubTab('Compare');

    // Empty-state should be gone
    await expect(investments.compareEmptyState).not.toBeVisible();
    // A recharts area or line chart should be present
    await expect(
      page.locator('.recharts-wrapper').first()
    ).toBeVisible();
  });

  /**
   * Calculator tab renders a projection chart for the default $10,000 amount.
   * At least one Y-axis tick must be non-zero, confirming the chart rendered.
   */
  test('calculator renders a projection chart with the default $10,000 amount', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    // The amount input must be pre-filled with 10000
    await expect(investments.calculatorAmountInput).toHaveValue('10000');

    // At least one Y-axis tick should be a non-zero dollar amount
    const ticks = await investments.calculatorYAxisTicks.allTextContents();
    const hasNonZero = ticks.some(t => t !== '$0' && t !== '$0.00' && t.includes('$'));
    expect(hasNonZero).toBe(true);
  });

  /**
   * Portfolio Builder shows one slider per fund (6 total) and the total
   * label turns green when the allocation reaches exactly 100%.
   */
  test('portfolio builder labels total as green when allocation reaches 100%', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // 6 sliders should be present
    await expect(investments.portfolioSliders).toHaveCount(6);

    // Set the first slider to 100 — that alone makes the total 100%
    await investments.setPortfolioSlider(0, 100);

    // The total label must be green (emerald) when allocation is exactly 100%
    await expect(investments.portfolioTotalLabel).toHaveClass(/text-emerald-400/);
  });
});
