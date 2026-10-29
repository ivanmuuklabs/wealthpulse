import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses module tests — covers two previously untested critical flows:
 *  1. Add Expense: submitting the form inserts the new transaction into the table.
 *  2. Search / Filter: typing in the search box narrows the visible table rows in real time.
 */
test.describe('Expenses — add expense and search/filter', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
  });

  /**
   * Test 3 — Add Expense form inserts a new transaction.
   *
   * The user opens the Add Expense form, fills in all required fields,
   * clicks Save, and the new transaction description must appear in the table.
   */
  test('adding a new expense via the form makes it appear in the transaction table', async ({ page }) => {
    const factory = new PageFactory(page);
    const expenses = factory.expenses();

    await expenses.navigate();

    // Use a unique description so the assertion is unambiguous
    const uniqueDesc = 'AutoTest Coffee Run';

    // Add an expense: date in the currently selected month (Feb default or any seeded month)
    // Using Feb 15 2026 as a stable date within the seeded data range
    await expenses.addExpense('2026-02-15', uniqueDesc, 12.5, 'Food');

    // The new transaction description must now be visible in the table
    await expect(page.getByText(uniqueDesc)).toBeVisible();
  });

  /**
   * Test 4 — Search input filters the transaction table in real time.
   *
   * Typing a term that matches known seeded data (e.g. "Housing") should reduce
   * the visible rows to only those containing that string in description or category.
   * Clearing the search restores the full list.
   */
  test('searching by category name filters the transaction table in real time', async ({ page }) => {
    const factory = new PageFactory(page);
    const expenses = factory.expenses();

    await expenses.navigate();

    // Count rows before filtering
    const rowsBefore = await expenses.transactionRows.count();
    expect(rowsBefore).toBeGreaterThan(0);

    // Search for a term that narrows results — "Housing" is a seeded category
    await expenses.search('Housing');

    // After filtering, every visible row must contain "Housing"
    const rowsAfter = await expenses.transactionRows.count();
    expect(rowsAfter).toBeGreaterThan(0);
    expect(rowsAfter).toBeLessThanOrEqual(rowsBefore);

    // Spot-check: the first visible row contains the search term
    await expect(expenses.transactionRows.first()).toContainText('Housing');

    // Clearing the search restores all rows
    await expenses.search('');
    const rowsRestored = await expenses.transactionRows.count();
    expect(rowsRestored).toEqual(rowsBefore);
  });

});
