import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';
import { ExpensesPage } from './pages/ExpensesPage';

/**
 * Transport budget — happy paths.
 *
 * Same determinism approach as budget.transport.edge.spec.ts: Math.random is stubbed to 0 so
 * Transport seeds as 2 x $5.00 = $10.00 in March against the default $300 budget ($290.00 left).
 */
test.describe('Budget — Transport happy paths', () => {
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
    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
  });

  test('a valid Transport expense is saved and reduces the remaining Transport budget', async () => {
    const spentBefore = await budgets.kpi('Total Spent');

    await expenses.navigate();
    await expenses.addExpense('Transport', 'Taxi to airport', '50.00');
    await budgets.navigate();

    // 10 seeded + 50 new = 60 of 300 => 20%, $240.00 left.
    await expect(budgets.transportRemaining).toHaveText('$240.00 left');
    await expect(budgets.transportPercent).toHaveText('20%');
    expect(await budgets.kpi('Total Spent')).toBeCloseTo(spentBefore + 50, 2);
  });

  test('increasing the Transport budget updates remaining amount and Total Budget', async () => {
    const budgetBefore = await budgets.kpi('Total Budget');

    await budgets.setTransportBudget('500');

    // 500 budget - 10 seeded spend = $490.00 left; Total Budget grows by the $200 increase.
    await expect(budgets.transportRemaining).toHaveText('$490.00 left');
    expect(await budgets.kpi('Total Budget')).toBeCloseTo(budgetBefore + 200, 2);
  });

  test('searching for "Transport" shows the Transport budget card', async () => {
    await budgets.searchInput.fill('Transport');

    await expect(budgets.transportCard).toHaveCount(1);
    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
  });
});
