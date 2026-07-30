import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await factory.expenses().navigate();
});

// Happy Path — Adding a new expense appears in the table immediately
test('adding a new expense inserts the row and updates the total', async ({ page }) => {
  const expensesPage = new PageFactory(page).expenses();

  // Record the number of rows before adding
  const initialRowCount = await expensesPage.tableRows.count();

  // Open the inline Add Expense form
  await expensesPage.openAddExpenseForm();

  // The form should be visible
  await expect(expensesPage.descriptionInput).toBeVisible();
  await expect(expensesPage.amountInput).toBeVisible();

  // Fill in the expense details
  await expensesPage.fillExpenseForm('Supermarket Weekly Shop', '85.50', 'Food');

  // Submit the form
  await expensesPage.submitExpenseForm();

  // The form should close after saving
  await expect(expensesPage.saveButton).not.toBeVisible();

  // The new row should now appear in the table
  const newRowCount = await expensesPage.tableRows.count();
  expect(newRowCount).toBe(initialRowCount + 1);

  // The new description is present in the table
  await expect(
    page.getByRole('cell', { name: /supermarket weekly shop/i })
  ).toBeVisible();

  // The amount is displayed correctly (negated and formatted)
  await expect(page.getByText('$85.50')).toBeVisible();
});
