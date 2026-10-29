import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Test 4 — Budgets: editing the inline budget limit updates the KPI cards
 *
 * Coverage gap addressed: the SET_BUDGET reducer path and inline spinbutton
 * in the Budgets tab were untested. Changing the Housing budget limit should
 * immediately recalculate the "Total Budget" and "Remaining" KPI stat cards,
 * verifying the reactive state update works end-to-end.
 */
test.describe('Budgets — edit budget limit', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();
  });

  test('changing the Housing budget limit recalculates the Total Budget KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read the current Total Budget KPI value before the edit
    const beforeText = await budgets.totalBudgetValue.textContent();
    const beforeAmount = parseFloat((beforeText ?? '').replace(/[$,]/g, ''));

    // The seeded Housing budget is $2,000. Increase it to $2,500 (+$500).
    await budgets.setBudgetLimit('Housing', 2500);

    // Total Budget KPI must increase by $500
    const afterText = await budgets.totalBudgetValue.textContent();
    const afterAmount = parseFloat((afterText ?? '').replace(/[$,]/g, ''));

    expect(afterAmount).toBeCloseTo(beforeAmount + 500, 0);
  });
});
