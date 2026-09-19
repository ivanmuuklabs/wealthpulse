import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Test 2 — Expenses: adding a new expense via the inline form
 *
 * Coverage gap addressed: the "Add Expense" flow (form open → fill → save)
 * was completely untested. This verifies the ADD_TRANSACTION reducer path
 * and that the table reflects the newly inserted row immediately.
 */
test.describe('Expenses — add expense form', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to Expenses
    await factory.expenses().navigate();
  });

  test('adding a new expense appends it to the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Count rows before adding
    const rowsBefore = await expenses.transactionRows.count();

    // Fill and submit the form
    await expenses.addExpense('Test Coffee Purchase', '8.50');

    // The form should close and the new row should appear in the table
    await expect(expenses.descriptionInput).not.toBeVisible();

    // Verify the description text is present in the table
    await expect(page.getByRole('cell', { name: 'Test Coffee Purchase' })).toBeVisible();

    // Row count must have increased by exactly one
    await expect(expenses.transactionRows).toHaveCount(rowsBefore + 1);
  });
});
