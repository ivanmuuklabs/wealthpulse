import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';
import { ExpensesPage } from './pages/ExpensesPage';

/**
 * Transport budget — happy paths.
 *
 * Determinism: Math.random is stubbed to 0 before the app loads (same approach as
 * budget.transport.edge.spec.ts), so Transport seeds as 2 x $5.00 = $10.00 for the selected
 * month against the default $300 budget.
 */
test.describe('Budget — Transport happy path', () => {
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

  test('Transport card shows seeded spend within the default budget in the healthy state', async () => {
    await expect(budgets.transportBudgetInput).toHaveValue('300');
    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
    await expect(budgets.transportPercent).toHaveText('3%');
    await expect(budgets.transportBar).toHaveClass(/\bbg-emerald-500\b/);
  });

  test('raising the Transport budget increases remaining and Total Budget', async () => {
    const budgetBefore = await budgets.kpi('Total Budget');

    await budgets.setTransportBudget('500');

    await expect(budgets.transportRemaining).toHaveText('$490.00 left');
    await expect(budgets.transportBar).toHaveClass(/\bbg-emerald-500\b/);
    expect(await budgets.kpi('Total Budget')).toBeCloseTo(budgetBefore + 200, 2);
  });

  test('adding a Transport expense updates the Transport card and Total Spent', async () => {
    const spentBefore = await budgets.kpi('Total Spent');

    await expenses.navigate();
    await expenses.addExpense('Transport', 'Happy path ride', '50.00');
    await budgets.navigate();

    await expect(budgets.transportRemaining).toHaveText('$240.00 left');
    await expect(budgets.transportPercent).toHaveText('20%');
    expect(await budgets.kpi('Total Spent')).toBeCloseTo(spentBefore + 50, 2);
  });
});
