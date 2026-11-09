import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';
import { ExpensesPage } from './pages/ExpensesPage';

/**
 * Transport budget — negative counterparts to budget.transport.happy.spec.ts (PR #63).
 *
 * Same determinism approach as the other Transport specs: Math.random is stubbed to 0 so
 * Transport seeds as 2 x $5.00 = $10.00 in March against the default $300 budget ($290.00 left).
 *
 * These tests cover the three flows the happy-path file exercises (save expense, change budget,
 * search) with inputs/conditions that must NOT produce the "happy" outcome.
 * Expected values were derived statically from src/App.jsx (BudgetsTab / ExpensesTab); not executed.
 */
test.describe('Budget — Transport negative counterparts to happy paths', () => {
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

  test('an expense larger than the remaining Transport budget shows the card as over budget', async () => {
    await expenses.navigate();
    await expenses.addExpense('Transport', 'Overspend', '400.00');
    await budgets.navigate();

    // 10 seeded + 400 = 410 of 300 => $110.00 over, 137%; must not still read as "left".
    await expect(budgets.transportRemaining).toHaveText('$110.00 over');
    await expect(budgets.transportPercent).toHaveText('137%');
  });

  test('an expense in another category does not change the Transport budget card', async () => {
    const spentBefore = await budgets.kpi('Total Spent');

    await expenses.navigate();
    await expenses.addExpense('Food', 'Wrong category for Transport', '50.00');
    await budgets.navigate();

    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
    // The expense was saved (Total Spent moved) but only against Food.
    expect(await budgets.kpi('Total Spent')).toBeCloseTo(spentBefore + 50, 2);
  });

  test('setting the Transport budget to 0 shows it over budget without NaN or Infinity', async ({ page }) => {
    const budgetBefore = await budgets.kpi('Total Budget');

    await budgets.setTransportBudget('0');

    // 0 budget - 10 seeded spend => $10.00 over; Total Budget drops by the old $300 limit.
    await expect(budgets.transportRemaining).toHaveText('$10.00 over');
    expect(await budgets.kpi('Total Budget')).toBeCloseTo(budgetBefore - 300, 2);
    await expect(page.locator('body')).not.toContainText('NaN');
    await expect(page.locator('body')).not.toContainText('Infinity');
  });

  test('searching for a different category hides the Transport budget card', async () => {
    await budgets.searchInput.fill('Food');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('searching for a misspelled category ("Transportx") shows no budget cards', async () => {
    await budgets.searchInput.fill('Transportx');

    await expect(budgets.transportCard).toHaveCount(0);
    await expect(budgets.budgetInputs).toHaveCount(0);
  });
});
