import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Test 4 — Budgets: edit budget limit and category search
 *
 * Coverage gap: Existing budget tests only compare KPI numbers between
 * months; they never test that the user can actually change a budget limit
 * via the inline numeric input, nor that the category search box filters cards.
 */
test.describe('Budgets — edit limit and search', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const budgets = factory.budgets();
    await budgets.navigate();
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
  });

  test('editing the Housing budget limit persists the new value in the input', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Set Housing budget to a distinct value
    await budgets.setBudgetLimit('Housing', 2500);

    // The input should now reflect the new value
    const newValue = await budgets.getBudgetInputValue('Housing');
    expect(newValue).toBe('2500');
  });

  test('searching categories filters the budget card list', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Search for "Food" — only the Food card should remain visible
    await budgets.searchCategory('Food');

    // At least the Food card must be visible
    await expect(page.getByText('Food').first()).toBeVisible();

    // "Housing" card should be hidden (not in DOM while search is active)
    await expect(
      page.locator('[class*="rounded-2xl"]').filter({ hasText: /^Housing/ })
    ).toHaveCount(0);
  });
});
