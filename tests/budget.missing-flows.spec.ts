import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets — missing-flow coverage
 *
 * PR #7 (budget-feb-mar-comparison) added comparison tests for Feb vs March.
 * This file fills the remaining untested flows on the Budgets tab:
 *
 *  1. Category search / filter
 *  2. Over-budget indicator (progress bar + remaining label)
 *  3. January month selector
 *  4. Editing a budget limit updates the Total Budget and Remaining KPI cards
 *
 * All tests use the seeded demo data and the BudgetsPage page object.
 */

test.describe('Budgets — missing flows', () => {
  /**
   * Login and navigate to the Budgets tab before each test.
   * Using beforeEach keeps tests isolated — each starts with a fresh
   * in-memory state (the app resets to seeded data on page load).
   */
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().goto();
  });

  // ─── 1. Category search ──────────────────────────────────────────────────

  test('search input filters visible category cards by name', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Before searching, all 8 category cards should be visible
    await expect(page.locator('p.font-semibold').filter({ hasText: /Housing|Food|Transport|Entertainment|Health|Utilities|Shopping|Subscriptions/ }))
      .toHaveCount(8);

    // Type "food" — only the Food card should remain visible
    await budgets.searchCategory('food');

    await expect(budgets.categoryCard('Food')).toBeVisible();

    // All other categories should be hidden (not rendered)
    for (const cat of ['Housing', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Shopping', 'Subscriptions']) {
      await expect(budgets.categoryCard(cat)).not.toBeVisible();
    }
  });

  test('clearing the search restores all category cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Filter down to one card
    await budgets.searchCategory('health');
    await expect(budgets.categoryCard('Health')).toBeVisible();
    await expect(budgets.categoryCard('Housing')).not.toBeVisible();

    // Clear the search — all 8 cards should return
    await budgets.clearSearch();
    for (const cat of ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Shopping', 'Subscriptions']) {
      await expect(budgets.categoryCard(cat)).toBeVisible();
    }
  });

  test('search is case-insensitive', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Mixed-case query should still match
    await budgets.searchCategory('TRANSPORT');
    await expect(budgets.categoryCard('Transport')).toBeVisible();
    await expect(budgets.categoryCard('Housing')).not.toBeVisible();
  });

  // ─── 2. Over-budget indicator ─────────────────────────────────────────────

  test('setting budget below spend shows "over" label and red progress bar', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Housing has a fixed rent of $1,200–$1,800 each month.
    // Setting the budget to $1 guarantees it is over budget.
    await budgets.setBudget('Housing', 1);

    // The remaining label should now say "over" (e.g. "$1,499.00 over")
    await expect(budgets.remainingLabel('Housing')).toHaveText(/over/i);

    // The progress bar fill should carry the red class applied when pct > 100
    await expect(budgets.progressBarFill('Housing')).toHaveClass(/bg-red-500/);
  });

  test('over-budget percentage label turns red and exceeds 100%', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Drive Housing over budget
    await budgets.setBudget('Housing', 1);

    // The percentage span on the card should be > 100 and styled red
    const pctLabel = budgets.categoryCard('Housing').locator('span.font-bold.tabular-nums');
    await expect(pctLabel).toHaveClass(/text-red-400/);

    const pctText = await pctLabel.textContent();
    const pctValue = parseInt(pctText ?? '0', 10);
    expect(pctValue).toBeGreaterThan(100);
  });

  // ─── 3. January month selector ────────────────────────────────────────────

  test('switching to January shows a valid Total Spent value', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Click the Jan button
    await budgets.janButton.click();

    // Total Spent should update and show a dollar amount (January has transactions)
    const janSpent = await budgets.getKpiAmount('Total Spent');
    expect(janSpent).toBeGreaterThan(0);
  });

  test('Total Spent differs across all three months (Jan / Feb / Mar)', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.janButton.click();
    const janSpent = await budgets.getKpiAmount('Total Spent');

    await budgets.febButton.click();
    const febSpent = await budgets.getKpiAmount('Total Spent');

    await budgets.marButton.click();
    const marSpent = await budgets.getKpiAmount('Total Spent');

    // Seeded data produces different spending each month
    expect(janSpent).not.toEqual(febSpent);
    expect(janSpent).not.toEqual(marSpent);
  });

  // ─── 4. Editing budget limit updates KPI cards ────────────────────────────

  test('increasing a budget limit immediately raises the Total Budget KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read the current Total Budget KPI
    const before = await budgets.getKpiAmount('Total Budget');

    // Increase the Housing budget by $500 (default is $2,000 → set to $2,500)
    await budgets.setBudget('Housing', 2500);

    // Total Budget should increase by $500
    const after = await budgets.getKpiAmount('Total Budget');
    expect(after).toBeCloseTo(before + 500, 0);
  });

  test('increasing a budget limit immediately raises the Remaining KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const remainingBefore = await budgets.getKpiAmount('Remaining');

    await budgets.setBudget('Food', 1000); // default is $600 → +$400

    const remainingAfter = await budgets.getKpiAmount('Remaining');
    expect(remainingAfter).toBeGreaterThan(remainingBefore);
  });

  test('Remaining KPI equals Total Budget minus Total Spent after editing a limit', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Edit a budget to ensure a known post-edit state
    await budgets.setBudget('Shopping', 600); // default is $400

    const totalBudget = await budgets.getKpiAmount('Total Budget');
    const totalSpent  = await budgets.getKpiAmount('Total Spent');
    const remaining   = await budgets.getKpiAmount('Remaining');

    // Allow $1 rounding tolerance
    expect(Math.abs(remaining - (totalBudget - totalSpent))).toBeLessThanOrEqual(1);
  });
});
