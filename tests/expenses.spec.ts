import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses tab — coverage tests added 2026-09-15
 *
 * Gaps addressed:
 *  3. Adding a new expense via the inline form.
 *  4. Searching transactions by keyword filters the table correctly.
 */

test.describe('Expenses tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expenses = factory.expenses();
    await expenses.navigate();
  });

  // Test 3 — Adding a new expense appears in the transaction table
  test('adding a new expense via the form inserts it into the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Open the add-expense form
    await expenses.openAddExpenseForm();

    // Fill and save a unique expense
    const uniqueDesc = 'Test Coffee Shop';
    await expenses.addExpense(uniqueDesc, '12.50', 'Food');

    // The new row should now be visible in the table
    await expect(page.getByRole('cell', { name: uniqueDesc })).toBeVisible();
  });

  // Test 4 — Searching by keyword filters the displayed transactions
  test('searching by keyword shows only matching transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Use a term that reliably matches seeded data
    await expenses.search('Rent');

    // All visible description cells must include "Rent"
    const descCells = page.locator('tbody tr td:nth-child(2)');
    const count = await descCells.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(descCells.nth(i)).toContainText('Rent', { ignoreCase: true });
    }
  });
});
