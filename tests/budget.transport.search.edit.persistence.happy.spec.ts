import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';
import { ExpensesPage } from './pages/ExpensesPage';

/**
 * Budgets search + budget edit — additional happy paths (companion to
 * budget.transport.search.interaction.happy.spec.ts and the negative spec from PR #73).
 *
 * Math.random is stubbed to 0 (same as the other Transport specs) so Transport seeds as
 * $10.00 against the default $300 budget.
 *
 * App behavior relied on (src/App.jsx on main): budgets live in the global reducer state
 * (SET_BUDGET), while the search term is local to BudgetsTab; remaining = budget - spent.
 */
test.describe('Budget — search + edit persistence happy path', () => {
  let budgets: BudgetsPage;
  let expenses: ExpensesPage;

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0;
    });

    const factory = new PageFactory(page);
    budgets = factory.budgets();
    expenses = factory.expenses();

    await factory.login().goto();
    await factory.login().loginAsDemo();
    await budgets.navigate();
  });

  test('lowering the Transport budget from the filtered card updates remaining and percent', async () => {
    await budgets.searchCategories('Transport');
    await expect(budgets.transportCard).toBeVisible();

    await budgets.setTransportBudget('100'); // spent $10.00 of $100.00

    await expect(budgets.transportRemaining).toHaveText('$90.00 left');
    await expect(budgets.transportPercent).toHaveText('10%');
  });

  test('a budget edited during a search persists after leaving and returning to the Budgets tab', async () => {
    await budgets.searchCategories('Transport');
    await budgets.setTransportBudget('500');
    await expect(budgets.transportRemaining).toHaveText('$490.00 left');

    await expenses.navigate();
    await budgets.navigate();

    await expect(budgets.transportBudgetInput).toHaveValue('500');
    await expect(budgets.transportRemaining).toHaveText('$490.00 left');
  });
});
