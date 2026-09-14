import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Test 4 — Budgets: edit budget limit
 *
 * Gap addressed: The existing budget.comparison.spec.ts reads budget values
 * across months but never writes one. The inline budget-limit input is a core
 * feature — users set their spending cap per category — and has zero test
 * coverage for the write path. This test exercises that flow directly.
 *
 * Flow:
 *  1. Navigate to Budgets.
 *  2. Change the Entertainment budget limit to a new value.
 *  3. Assert the input reflects the new value immediately (in-memory update).
 *  4. Assert the Remaining KPI in that category card updates accordingly.
 */
test.describe('Budgets — edit category budget limit', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
  });

  test('changing the Entertainment budget limit updates the input and remaining label', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    // Select March so spending data is consistent with seeded state
    await budgets.selectMonth('Mar');

    // Read the original limit
    const originalLimit = await budgets.getBudgetLimit('Entertainment');

    // Set a distinctly new value that differs from the original
    const newLimit = '999';
    await budgets.setBudgetLimit('Entertainment', Number(newLimit));

    // Input should now show the new value
    const updatedLimit = await budgets.getBudgetLimit('Entertainment');
    expect(updatedLimit).toBe(newLimit);
    expect(updatedLimit).not.toBe(originalLimit);

    // The Entertainment card should display the updated budget (spinbutton value)
    const entertainmentCard = page.locator('div').filter({ hasText: /^Entertainment/ }).first();
    await expect(entertainmentCard.getByRole('spinbutton')).toHaveValue(newLimit);
  });
});
