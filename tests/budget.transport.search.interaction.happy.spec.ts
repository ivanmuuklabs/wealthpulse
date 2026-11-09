import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';

/**
 * Budgets category search — happy paths combining search with other Budgets interactions
 * (not covered by the existing search happy specs, which only check visibility and KPIs).
 *
 * Math.random is stubbed to 0 (same as the other Transport specs) so Transport seeds as
 * $10.00 against the default $300 budget.
 */
test.describe('Budget — category search interaction happy path', () => {
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

  test('a middle-of-name term ("anspor") keeps the Transport card visible', async () => {
    await budgets.searchCategories('anspor');

    await expect(budgets.transportCard).toBeVisible();
    await expect(budgets.transportPercent).toHaveText('3%');
  });

  test('raising the Transport budget from the filtered card updates remaining and Total Budget', async () => {
    const budgetBefore = await budgets.kpi('Total Budget');

    await budgets.searchCategories('Transport');
    await expect(budgets.transportCard).toBeVisible();

    await budgets.setTransportBudget('500');

    await expect(budgets.transportRemaining).toHaveText('$490.00 left');
    expect(await budgets.kpi('Total Budget')).toBeCloseTo(budgetBefore + 200, 2);
  });

  test('a budget edited during a search persists after clearing the search', async () => {
    await budgets.searchCategories('Transport');
    await budgets.setTransportBudget('500');
    await expect(budgets.transportRemaining).toHaveText('$490.00 left');

    await budgets.searchCategories('');

    await expect(budgets.transportCard).toBeVisible();
    await expect(budgets.transportBudgetInput).toHaveValue('500');
    await expect(budgets.transportRemaining).toHaveText('$490.00 left');
  });
});
