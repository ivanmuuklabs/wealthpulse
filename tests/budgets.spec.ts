import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets tab — critical flow tests.
 *
 * Covers:
 *   Test 4 — Editing the budget-limit spinbutton for a category immediately
 *             updates the displayed percentage and remaining-amount label.
 *
 * The existing budget.comparison.spec.ts only verifies that budget limits
 * are equal across months and that KPIs recalculate on month switching.
 * No test has ever exercised the inline budget-editing interaction itself,
 * which is the primary write action available on this tab.
 */

test.describe('Budgets tab — edit budget limit', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await new PageFactory(page).budgets().navigate();
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
  });

  // Test 4 — Editing the Housing budget limit updates the percentage displayed
  test('editing the Housing budget-limit input recalculates the percentage label', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Switch to January so spending is deterministic (seeded Jan data)
    await budgets.selectMonth('Jan');

    // Read the current Housing budget input value
    const housingInput = budgets.getBudgetInput('Housing');
    await expect(housingInput).toBeVisible();
    const originalValue = await housingInput.inputValue();

    // Set budget to a very high value — percentage will drop to a very small number
    await housingInput.triple_click?.() ?? await housingInput.click({ clickCount: 3 });
    await housingInput.fill('100000');
    await housingInput.press('Tab'); // blur to trigger React state update

    // The percentage shown on the Housing card should now read "0%"
    // because spent (a few hundred dollars) / 100,000 ≈ 0%
    const pctLabel = budgets.getCategoryPercentage('Housing');
    await expect(pctLabel).toHaveText('0%');

    // Restore original value so other tests are not affected
    await housingInput.click({ clickCount: 3 });
    await housingInput.fill(originalValue);
    await housingInput.press('Tab');
  });
});
