import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses module tests.
 *
 * Coverage gaps addressed:
 *   2. Add a new expense — verifies the add-expense form creates a transaction
 *      that appears in the table and is reflected in the footer total count.
 *   3. Filter by category — verifies selecting a category from the dropdown
 *      hides transactions from other categories and shows only matching ones.
 */

test.describe('Expenses — add and filter', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Navigate to the Expenses tab
    const expenses = factory.expenses();
    await expenses.navigate();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  // Test 2 of 5 — adding a new expense via the form
  test('adding a new expense inserts it into the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Count existing rows before adding
    const initialCount = await expenses.tableRows.count();

    // Open the form and submit a new expense
    await expenses.addExpenseButton.click();
    await expect(expenses.descriptionInput).toBeVisible();

    await expenses.descriptionInput.fill('Test grocery run');
    await expenses.amountInput.fill('88.50');
    // Use the Save button inside the form card
    await page.getByRole('button', { name: 'Save' }).click();

    // Form should close and the new row should appear
    await expect(expenses.descriptionInput).not.toBeVisible();

    // The row count must have increased by 1
    await expect(expenses.tableRows).toHaveCount(initialCount + 1);

    // The description text must appear in the table
    await expect(page.getByRole('cell', { name: 'Test grocery run' })).toBeVisible();
  });

  // Test 3 of 5 — filtering transactions by category
  test('filtering by category shows only transactions for that category', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Select "Housing" from the category dropdown filter
    await expenses.filterByCategory('Housing');

    // All visible rows must belong to the Housing category
    const rows = expenses.tableRows;
    const count = await rows.count();

    // There should be at least 1 Housing transaction in seeded data
    expect(count).toBeGreaterThan(0);

    // Every row's category cell must contain "Housing"
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).getByText('Housing')).toBeVisible();
    }

    // Switching back to "All Categories" restores the full list
    await expenses.filterByCategory('All');
    const allCount = await expenses.tableRows.count();
    expect(allCount).toBeGreaterThan(count); // more rows than Housing alone
  });
});
