import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';
import { ExpensesPage } from './pages/ExpensesPage';

/**
 * Transport budget — negative tests.
 *
 * Same determinism approach as budget.transport.edge.spec.ts: Math.random is stubbed to 0 so
 * Transport seeds as 2 x $5.00 = $10.00 in March against the default $300 budget ($290.00 left).
 *
 * NOTE: the last two tests assert the *intended* behavior (invalid numeric input is rejected)
 * and are expected to FAIL against the current app, which accepts negative values
 * (ExpensesTab.handleAdd only checks for non-empty fields; BudgetsTab passes +e.target.value
 * straight to SET_BUDGET). Confirm intended behavior before changing the tests or the app.
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
    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
  });

  test('expense without an amount is not saved and Transport spend is unchanged', async () => {
    await expenses.navigate();
    await expenses.addExpenseButton.click();
    await expenses.descriptionInput.fill('No amount expense');
    await expenses.categorySelect.selectOption('Transport');
    await expenses.saveButton.click();

    // The form stays open because the submit is ignored.
    await expect(expenses.saveButton).toBeVisible();

    await budgets.navigate();
    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
  });

  test('expense without a description is not saved and Transport spend is unchanged', async () => {
    await expenses.navigate();
    await expenses.addExpenseButton.click();
    await expenses.amountInput.fill('50.00');
    await expenses.categorySelect.selectOption('Transport');
    await expenses.saveButton.click();

    await expect(expenses.saveButton).toBeVisible();

    await budgets.navigate();
    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
  });

  test('searching for a non-existent category shows no budget cards and no NaN', async ({ page }) => {
    await budgets.searchInput.fill('zzz-no-such-category');

    await expect(budgets.transportCard).toHaveCount(0);
    await expect(budgets.budgetInputs).toHaveCount(0);
    // Overview KPIs are still rendered and well-formed.
    await expect(page.getByText('Total Budget', { exact: true })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('NaN');
  });

  // Expected to FAIL today: the app accepts a negative budget.
  test('negative Transport budget is rejected and does not reduce Total Budget below the other categories', async () => {
    const budgetBefore = await budgets.kpi('Total Budget');

    await budgets.setTransportBudget('-50');

    // A negative limit is invalid: Total Budget must never drop by more than the old $300 limit.
    expect(await budgets.kpi('Total Budget')).toBeGreaterThanOrEqual(budgetBefore - 300);
    await expect(budgets.transportBudgetInput).not.toHaveValue('-50');
  });

  // Expected to FAIL today: the app accepts a negative expense amount.
  test('negative expense amount is rejected and does not lower Transport spend', async () => {
    await expenses.navigate();
    await expenses.addExpense('Transport', 'Negative amount', '-100.00');
    await budgets.navigate();

    // Spend must not decrease below the seeded $10.00 (i.e. remaining must not exceed $290.00).
    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
  });
});
