import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.describe('Expenses', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
  });

  /**
   * Test 3 — Adding a new expense appears in the transactions table.
   *
   * The Expenses module lets users open a form via "Add Expense", fill in a
   * description, amount, and category, then save. The new transaction must
   * immediately appear in the table. This test covers the full add-expense
   * user flow end-to-end and validates that the in-memory state update
   * propagates correctly to the rendered list.
   */
  test('adding a new expense makes it appear in the transactions table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const uniqueDescription = `Playwright Test Expense ${Date.now()}`;
    const amount = 42.99;

    // Record the row count before adding
    const rowsBefore = await expenses.transactionRows.count();

    // Open the form and fill it in
    await expenses.addExpenseButton.click();

    // The form should expand — description field must be visible
    await expect(expenses.descriptionInput).toBeVisible();

    await expenses.descriptionInput.fill(uniqueDescription);
    await expenses.amountInput.fill(String(amount));
    // Category defaults to Food — no change needed
    await expenses.saveButton.click();

    // After saving, the form should close
    await expect(expenses.descriptionInput).not.toBeVisible();

    // The table should now have one more row
    await expect(expenses.transactionRows).toHaveCount(rowsBefore + 1);

    // The new row must contain the description we entered
    await expect(page.getByText(uniqueDescription)).toBeVisible();

    // The amount must also appear formatted in the table
    await expect(page.getByText(/\$42\.99|\$43\.00/)).toBeVisible();
  });

});
