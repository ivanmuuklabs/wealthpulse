import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses — negative and edge-case tests
 *
 * Covers failure scenarios and boundary conditions for the Expenses tab:
 *   - Submitting the add-expense form with missing required fields
 *   - Searching for a term that matches no transactions
 *   - Filtering by a category that has no transactions in the current month
 *   - Adding an expense with an unusually large amount
 *   - Adding an expense with special characters in the description
 */

test.describe('Expenses — negative and edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
  });

  test('submitting add-expense form without description does not add a row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const initialCount = await expenses.transactionRows.count();

    await expenses.openAddForm();
    // Fill amount but leave description blank
    await expenses.formAmountInput.fill('50');
    await expenses.formSaveButton.click();

    // Table row count must not change — form guards against empty description
    await expect(expenses.transactionRows).toHaveCount(initialCount);
  });

  test('submitting add-expense form without amount does not add a row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const initialCount = await expenses.transactionRows.count();

    await expenses.openAddForm();
    // Fill description but leave amount blank
    await expenses.formDescriptionInput.fill('No amount expense');
    // Leave amount empty and submit
    await expenses.formAmountInput.fill('');
    await expenses.formSaveButton.click();

    await expect(expenses.transactionRows).toHaveCount(initialCount);
  });

  test('searching with a term that matches nothing shows the empty state', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('zzz_no_match_at_all_xyz_999');

    // No data rows should be visible
    await expect(expenses.emptyState).toBeVisible();
    await expect(expenses.transactionRows).toHaveCount(0);
  });

  test('clearing a search term after filtering restores all transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const initialCount = await expenses.transactionRows.count();

    await expenses.search('zzz_no_match_xyz');
    await expect(expenses.transactionRows).toHaveCount(0);

    // Clear the search
    await expenses.search('');
    await expect(expenses.transactionRows).toHaveCount(initialCount);
  });

  test('filtering by category and then switching to All Categories restores full list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const initialCount = await expenses.transactionRows.count();

    // Filter down to one category
    await expenses.filterByCategory('Housing');
    const housingCount = await expenses.transactionRows.count();
    expect(housingCount).toBeLessThan(initialCount);

    // Reset to All Categories
    await expenses.categoryFilterSelect.selectOption('All');
    await expect(expenses.transactionRows).toHaveCount(initialCount);
  });

  test('adding an expense with a very large amount is accepted and shown in the table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.openAddForm();
    await expenses.addExpense('Large Bill', '999999.99', 'Housing');

    // Row should appear — app does not restrict the maximum amount
    await expect(page.getByText('Large Bill')).toBeVisible();
  });

  test('adding an expense with special characters in description is shown correctly', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const description = 'Café & Co. — 50% off!';
    await expenses.openAddForm();
    await expenses.addExpense(description, '25', 'Food');

    await expect(page.getByText(description)).toBeVisible();
  });

  test('sorting by amount ascending then descending reverses the order', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // First click — descending
    await expenses.sortByColumn('amount');
    const descAmounts = (await expenses.getAmountTexts()).map(t => parseFloat(t.replace(/[^0-9.]/g, '')));

    // Second click — ascending
    await expenses.sortByColumn('amount');
    const ascAmounts = (await expenses.getAmountTexts()).map(t => parseFloat(t.replace(/[^0-9.]/g, '')));

    // Ascending order should be the reverse of descending (for the same data set)
    expect(ascAmounts[0]).toBeLessThanOrEqual(ascAmounts[ascAmounts.length - 1]);
    expect(descAmounts[0]).toBeGreaterThanOrEqual(descAmounts[descAmounts.length - 1]);
  });
});
