import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';
import { ExpensesPage } from './pages/ExpensesPage';

/**
 * Transport budget — negative tests.
 *
 * Determinism: Math.random is stubbed to 0 before the app loads (same approach as
 * budget.transport.edge.spec.ts / budget.transport.happy.spec.ts), so Transport seeds as
 * 2 x $5.00 = $10.00 against the default $300 budget => "$290.00 left", 3%.
 *
 * App behavior relied on (src/App.jsx):
 *  - ExpensesTab.handleAdd returns early when description or amount is empty (form stays open).
 *  - BudgetsTab filters cards by category name via the search box.
 *  - pct > 100 renders the red over-budget style and "<amount> over".
 */
test.describe('Budget — Transport negative tests', () => {
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

  test('saving a Transport expense without a description is rejected and the budget is unchanged', async () => {
    const spentBefore = await budgets.kpi('Total Spent');

    await expenses.navigate();
    await expenses.addExpenseButton.click();
    await expenses.amountInput.fill('50.00');
    await expenses.categorySelect.selectOption('Transport');
    await expenses.saveButton.click();

    // The form stays open: nothing was submitted.
    await expect(expenses.descriptionInput).toBeVisible();

    await budgets.navigate();
    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
    await expect(budgets.transportPercent).toHaveText('3%');
    expect(await budgets.kpi('Total Spent')).toBeCloseTo(spentBefore, 2);
  });

  test('saving a Transport expense without an amount is rejected and the budget is unchanged', async () => {
    const spentBefore = await budgets.kpi('Total Spent');

    await expenses.navigate();
    await expenses.addExpenseButton.click();
    await expenses.descriptionInput.fill('Negative no amount');
    await expenses.categorySelect.selectOption('Transport');
    await expenses.saveButton.click();

    await expect(expenses.amountInput).toBeVisible();

    await budgets.navigate();
    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
    await expect(budgets.transportPercent).toHaveText('3%');
    expect(await budgets.kpi('Total Spent')).toBeCloseTo(spentBefore, 2);
  });

  test('an expense in another category does not change the Transport card', async () => {
    await expenses.navigate();
    await expenses.addExpense('Food', 'Negative other category', '25.00');
    await budgets.navigate();

    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
    await expect(budgets.transportPercent).toHaveText('3%');
    await expect(budgets.transportBar).toHaveClass(/\bbg-emerald-500\b/);
  });

  test('searching for a non-matching category hides the Transport card', async () => {
    await budgets.searchCategories('zzzz-no-such-category');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('lowering the Transport budget below the seeded spend shows over-budget, not healthy', async () => {
    const budgetBefore = await budgets.kpi('Total Budget');

    await budgets.setTransportBudget('5'); // spent $10.00 vs budget $5.00

    await expect(budgets.transportRemaining).toHaveText('$5.00 over');
    await expect(budgets.transportPercent).toHaveText('200%');
    await expect(budgets.transportPercent).toHaveClass(/text-red-400/);
    await expect(budgets.transportBar).toHaveClass(/\bbg-red-500\b/);
    await expect(budgets.transportBar).not.toHaveClass(/\bbg-emerald-500\b/);
    // Total Budget drops by exactly 300 - 5.
    expect(await budgets.kpi('Total Budget')).toBeCloseTo(budgetBefore - 295, 2);
  });
});
