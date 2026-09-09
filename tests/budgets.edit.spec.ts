import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets — edit budget limit
 *
 * Coverage gap: the inline budget-limit spinbutton per category was untested.
 * budget.comparison.spec.ts only reads budget values across months; it never
 * writes a new limit. This test covers the write path: change the Housing
 * budget, confirm the input reflects the new value, and confirm the Total
 * Budget KPI updates accordingly.
 */
test.describe('Budgets — edit budget limit', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const budgets = factory.budgets();
    await budgets.navigate();
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
  });

  test('changing the Housing budget limit is reflected in the input and Total Budget KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read the current Total Budget KPI before editing
    const beforeTotal = await budgets.getKpiValue('Total Budget');

    // Housing default is $2,000 — change it to $2,500
    await budgets.setBudgetLimit('Housing', '2500');

    // The spinbutton must now read the new value
    const updatedValue = await budgets.getBudgetInputValue('Housing');
    expect(updatedValue).toBe('2500');

    // The Total Budget KPI must have increased by $500
    const afterTotal = await budgets.getKpiValue('Total Budget');
    expect(afterTotal).not.toBeNull();
    expect(beforeTotal).not.toBeNull();

    // Parse both and confirm the delta
    const parseAmt = (s: string | null) => parseFloat((s ?? '0').replace(/[$,]/g, ''));
    expect(parseAmt(afterTotal)).toBeCloseTo(parseAmt(beforeTotal) + 500, 0);
  });
});
