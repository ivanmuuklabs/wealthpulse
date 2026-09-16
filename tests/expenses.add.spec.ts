import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Test 2 — Expenses: add expense
 *
 * Coverage gap: The Expenses module has zero tests. The "Add Expense" form
 * (description + amount + category + Save) is a core user action — once
 * saved, the new row must appear in the transaction table immediately.
 */
test('adding a new expense appends it to the transaction table', async ({ page }) => {
  const factory = new PageFactory(page);

  // Authenticate
  await factory.login().goto();
  await factory.login().loginAsDemo();

  // Navigate to Expenses
  const expenses = factory.expenses();
  await expenses.navigate();

  // Confirm we are on the Expenses page
  await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();

  // Open the "Add Expense" form
  await expenses.addExpenseButton.click();

  // Fill the form — description and amount are required; category defaults to Food
  await expenses.descriptionInput.fill('Playwright test coffee');
  await expenses.amountInput.fill('4.50');
  // Leave category as the default (Food)

  // Submit
  await expenses.saveButton.click();

  // The new row must appear in the table
  await expect(page.getByText('Playwright test coffee')).toBeVisible();

  // The form should close after saving
  await expect(expenses.descriptionInput).not.toBeVisible();
});
