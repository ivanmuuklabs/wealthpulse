import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';

/**
 * Budgets category search — happy paths for the Transport card.
 *
 * Uses BudgetsPage.searchCategories() added in PR #64. Math.random is stubbed to 0 (same as
 * budget.transport.happy.spec.ts) so Transport seeds as $10.00 against the default $300 budget.
 */
test.describe('Budget — category search happy path', () => {
  let budgets: BudgetsPage;

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0;
    });

    const factory = new PageFactory(page);
    budgets = factory.budgets();

    await factory.login().goto();
    await factory.login().loginAsDemo();
    await budgets.navigate();
  });

  test('searching for "Transport" keeps the Transport card visible with its seeded values', async () => {
    await budgets.searchCategories('Transport');

    await expect(budgets.transportCard).toBeVisible();
    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
    await expect(budgets.transportPercent).toHaveText('3%');
  });

  test('clearing the search restores the Transport card', async () => {
    await budgets.searchCategories('zzzz-no-such-category');
    await expect(budgets.transportCard).toHaveCount(0);

    await budgets.searchCategories('');

    await expect(budgets.transportCard).toBeVisible();
    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
  });
});
