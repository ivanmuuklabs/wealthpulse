import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

// Test 3 — Expenses: Add Expense form submits and the new transaction appears in the table
test.describe('Expenses — Add Expense', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Expenses module
    const expenses = factory.expenses();
    await expenses.navigate();
  });

  test('submitting the Add Expense form adds the new transaction to the table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Count rows before adding
    const initialCount = await expenses.tableRows.count();

    // Add a new expense for January
    await expenses.selectMonth('Jan');
    await expenses.addExpense('2026-01-20', 'Automation Coffee', 12.5, 'Food');

    // The form should close and the table should have one more row
    await expect(expenses.saveExpenseButton).not.toBeVisible();
    const newCount = await expenses.tableRows.count();
    expect(newCount).toBe(initialCount + 1);

    // The new description must appear somewhere in the table
    await expect(page.getByText('Automation Coffee')).toBeVisible();
  });

});
