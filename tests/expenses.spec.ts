import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.describe('Expenses', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Expenses module
    const expensesPage = factory.expenses();
    await expensesPage.navigate();

    // Confirm the Expenses view is loaded before each test
    await expect(page.getByRole('button', { name: /expenses/i })).toHaveClass(/text-emerald-400/);
  });

  // Test 1 — Search filters the transaction table in real time
  test('searching by description filters the transaction table in real time', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // Capture the full unfiltered row count
    const totalRows = await expensesPage.tableRows.count();
    expect(totalRows).toBeGreaterThan(0);

    // Search for a term likely to appear in at least one transaction description
    await expensesPage.search('Netflix');

    // Wait for the table to react; every remaining row must contain the search term
    await expect(expensesPage.tableRows.first()).toBeVisible();
    const filteredCount = await expensesPage.tableRows.count();
    expect(filteredCount).toBeLessThan(totalRows);

    // Every visible row must include "Netflix" somewhere in its text
    for (let i = 0; i < filteredCount; i++) {
      await expect(expensesPage.tableRows.nth(i)).toContainText(/netflix/i);
    }

    // Clearing the search restores the full table
    await expensesPage.search('');
    await expect(expensesPage.tableRows).toHaveCount(totalRows);
  });

  // Test 2 — Adding a new expense inserts it into the transaction table
  test('adding a new expense makes it appear in the transaction table', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    const description = 'Amikoo QA Coffee';

    // Open the add-expense form
    await expensesPage.openAddExpenseForm();

    // The save button should now be visible (form expanded)
    await expect(expensesPage.saveButton).toBeVisible();

    // Fill in the expense details
    await expensesPage.descriptionInput.fill(description);
    const amountField = page.getByRole('spinbutton');
    await amountField.fill('42.50');

    // Submit
    await expensesPage.saveExpense();

    // The form should close (Save button disappears) and the new row appears
    await expect(expensesPage.saveButton).not.toBeVisible();
    await expect(expensesPage.tableRows.filter({ hasText: description })).toHaveCount(1);
  });
});
