import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses — add expense
 *
 * Coverage gap: the Expenses tab "Add Expense" form was completely untested.
 * This test covers the critical create-transaction happy path: open the form,
 * fill description + amount, submit, and confirm the new row appears in the
 * transaction table.
 */
test.describe('Expenses — add expense flow', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Expenses tab
    const expenses = factory.expenses();
    await expenses.navigate();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  test('adding a new expense appends it to the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Record the current number of visible transaction rows before adding
    const countBefore = await expenses.transactionRows.count();

    // Add a new expense: description, amount, category
    await expenses.addExpense('Test coffee shop', '12.50', 'Food');

    // The new row must appear — table should have one more row
    await expect(expenses.transactionRows).toHaveCount(countBefore + 1);

    // The new transaction's description must be visible in the table
    await expect(page.getByRole('cell', { name: 'Test coffee shop' })).toBeVisible();
  });
});
