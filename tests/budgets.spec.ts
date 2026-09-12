import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets tab — coverage for flows not included in budget.comparison.spec.ts.
 *
 * budget.comparison.spec.ts already covers KPI comparison across months and the
 * Remaining recalculation formula. These tests target the interactive flows
 * that were completely untested:
 *  - Editing a category budget limit via the inline spinbutton
 *  - Category search input filters and clears correctly
 *  - Month switching in the Budgets tab updates Total Spent
 */

test.describe('Budgets — interactive editing and filtering', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Navigate to the Budgets tab
    await new PageFactory(page).budgets().navigate();
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
  });

  // ── Test 1 ──────────────────────────────────────────────────────────────
  // Increasing a category budget limit raises the Total Budget KPI.
  // This verifies the spinbutton → state → KPI flow which is entirely
  // different from the month-comparison coverage in budget.comparison.spec.ts.
  test('increasing the Housing budget limit raises the Total Budget KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read the current Total Budget KPI
    const before = await budgets.getKpiValue('Total Budget');
    const beforeNum = parseFloat((before ?? '0').replace(/[$,]/g, ''));

    // Read current Housing spinbutton value and increase it by 500
    const spinbutton = budgets.categorySpinbutton('Housing');
    await expect(spinbutton).toBeVisible();
    const currentVal = await spinbutton.inputValue();
    const newVal = String(parseInt(currentVal, 10) + 500);

    await spinbutton.fill(newVal);
    await spinbutton.press('Tab'); // commit the change

    // Total Budget KPI must increase by approximately 500
    const after = await budgets.getKpiValue('Total Budget');
    const afterNum = parseFloat((after ?? '0').replace(/[$,]/g, ''));

    expect(afterNum).toBeGreaterThan(beforeNum);
    expect(afterNum - beforeNum).toBeCloseTo(500, 0);
  });

  // ── Test 2 ──────────────────────────────────────────────────────────────
  // Category search input narrows the visible budget cards.
  test('searching for "Housing" shows exactly one budget card', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // All 8 categories should be visible initially
    const allCategories = ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Shopping', 'Subscriptions'];
    for (const cat of allCategories) {
      await expect(page.getByText(cat).first()).toBeVisible();
    }

    // Search for Housing
    await budgets.searchCategories('Housing');

    // Only Housing should remain visible; others hidden
    await expect(page.getByText('Housing').first()).toBeVisible();
    await expect(page.getByText('Food').first()).not.toBeVisible();
    await expect(page.getByText('Transport').first()).not.toBeVisible();
  });

  // ── Test 3 ──────────────────────────────────────────────────────────────
  // Clearing the category search restores all 8 budget cards.
  test('clearing the category search restores all 8 budget cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Filter down to one result, then clear
    await budgets.searchCategories('Housing');
    await expect(page.getByText('Food').first()).not.toBeVisible();

    await budgets.clearSearch();

    // All categories should be visible again
    const allCategories = ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Shopping', 'Subscriptions'];
    for (const cat of allCategories) {
      await expect(page.getByText(cat).first()).toBeVisible();
    }
  });

  // ── Test 4 ──────────────────────────────────────────────────────────────
  // Month switching in the Budgets tab changes the Total Spent KPI.
  // This is different from the existing comparison test — it verifies the
  // month selector within the Budgets page itself, not the Budgets page's
  // month comparison from budget.comparison.spec.ts.
  test('switching months on the Budgets tab updates the Total Spent KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read March Total Spent (default month is March)
    await budgets.marButton.click();
    const marSpent = await budgets.getKpiValue('Total Spent');

    // Switch to January
    await budgets.janButton.click();
    const janSpent = await budgets.getKpiValue('Total Spent');

    // Seeded data has different spending per month
    expect(janSpent).not.toEqual(marSpent);
  });
});
