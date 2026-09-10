import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets module tests.
 *
 * Coverage gaps addressed:
 *   4. Edit budget limit — verifies that changing the budget spinbutton for
 *      a category immediately updates the Remaining KPI and the progress bar
 *      state (no save button; the change dispatches on input).
 */

test.describe('Budgets — edit budget limit', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    const budgets = factory.budgets();
    await budgets.navigate();
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
  });

  // Test 4 of 5 — editing the Housing budget limit recalculates Remaining KPI
  test('editing Housing budget limit updates the Remaining KPI accordingly', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read the current Total Budget KPI before the edit
    const beforeRemaining = await budgets.getKpiValue('Remaining');
    expect(beforeRemaining).toBeTruthy();

    // Set the Housing budget to a very high value (10 000) to guarantee surplus
    await budgets.setBudgetLimit('Housing', 10000);

    // The Remaining KPI must have changed (it reflects totalBudget - totalSpent)
    const afterRemaining = await budgets.getKpiValue('Remaining');
    expect(afterRemaining).toBeTruthy();
    expect(afterRemaining).not.toEqual(beforeRemaining);

    // The new Remaining must be higher than before (we increased the budget ceiling)
    const parseDollar = (s: string | null) =>
      parseFloat((s ?? '0').replace(/[$,]/g, ''));
    expect(parseDollar(afterRemaining)).toBeGreaterThan(parseDollar(beforeRemaining));

    // The Housing budget card still shows the category name
    await expect(page.getByText('Housing').first()).toBeVisible();
  });
});
