import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses — critical flows not yet covered.
 *
 * Test 3: The "Add Expense" form accepts a description + amount, saves the
 *         transaction to state, and the new row appears immediately in the
 *         expense table.
 */

test.describe('Expenses', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Navigate to the Expenses tab
    const expenses = factory.expenses();
    await expenses.navigate();
  });

  // Test 3 — Add a new expense and verify it appears in the table
  test('adding a new expense saves it to the table immediately', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Count rows before adding
    const rowsBefore = await page.locator('table tbody tr').count();

    // Open the add-expense form
    await expenses.openAddExpenseForm();
    await expect(expenses.newExpenseForm).toBeVisible();

    // Fill and submit the form
    await expenses.fillAndSaveExpense('Test Coffee Shop', '12.50', 'Food');

    // Form should close after a successful save
    await expect(expenses.newExpenseForm).not.toBeVisible();

    // The new row should be added to the table
    const rowsAfter = await page.locator('table tbody tr').count();
    expect(rowsAfter).toBeGreaterThan(rowsBefore);

    // The description of the new transaction should be visible in the table
    await expect(page.getByText('Test Coffee Shop')).toBeVisible();
  });
});
