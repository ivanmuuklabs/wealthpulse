import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Negative / edge-case tests for the Expenses tab.
 *
 * User story: As a user I should see clear feedback when my input is
 * invalid or produces no results, so the app does not silently fail.
 *
 * Scenarios covered:
 *  1. Search that matches nothing shows "No transactions found".
 *  2. Submitting the add-expense form with no description does NOT add a row.
 *  3. Submitting the add-expense form with no amount does NOT add a row.
 *  4. Category filter "All" reverts to showing all transactions after filtering.
 *  5. Searching in one category filter context shows subset-intersected results.
 *  6. Switching months clears the search — each month is independent.
 */

test.describe('Expenses — negative and edge cases', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.expenses().navigate();
  });

  // Negative 1 — Search with no match shows empty state
  test('search term with no match shows "No transactions found"', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('xyzzy_no_match_12345');

    await expect(expenses.noTransactionsMessage).toBeVisible();
    // No data rows must be rendered
    await expect(expenses.tableRows).toHaveCount(0);
  });

  // Negative 2 — Saving without a description does not add a row
  test('saving expense form without description does not add a new row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const countBefore = await expenses.tableRows.count();

    await expenses.openAddForm();
    // Fill amount but leave description empty
    await expenses.formAmountInput.fill('25.00');
    await expenses.formSaveButton.click();

    // Row count must not have changed
    await expect(expenses.tableRows).toHaveCount(countBefore);
  });

  // Negative 3 — Saving without an amount does not add a row
  test('saving expense form without amount does not add a new row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const countBefore = await expenses.tableRows.count();

    await expenses.openAddForm();
    // Fill description but leave amount empty
    await expenses.formDescriptionInput.fill('Ghost expense');
    await expenses.formSaveButton.click();

    // Row count must not have changed
    await expect(expenses.tableRows).toHaveCount(countBefore);
  });

  // Negative 4 — Resetting category filter to "All" shows all transactions again
  test('resetting category filter to "All" shows all transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Filter to a specific category first
    await expenses.filterByCategory('Health');
    const filteredCount = await expenses.tableRows.count();

    // Reset to "All"
    await expenses.categoryFilter.selectOption('All');
    const allCount = await expenses.tableRows.count();

    // All count must be greater than the filtered count (seeded data has multiple categories)
    expect(allCount).toBeGreaterThan(filteredCount);
  });

  // Negative 5 — Search within a category filter produces a strict intersection
  test('search within a category filter only returns matching category+description rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Filter to Food, then search for a term unlikely to appear in Food
    await expenses.filterByCategory('Food');
    await expenses.search('electricity');

    // Seeded Food descriptions don't include "electricity" → no results
    await expect(expenses.noTransactionsMessage).toBeVisible();
  });

  // Negative 6 — Clearing search restores the full month's list
  test('clearing the search input restores all transactions for the month', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Get the baseline count (all March transactions)
    const totalCount = await expenses.tableRows.count();

    // Narrow the list
    await expenses.search('rent');
    const narrowedCount = await expenses.tableRows.count();
    expect(narrowedCount).toBeLessThan(totalCount);

    // Clear search
    await expenses.searchInput.clear();

    // All rows must be back
    await expect(expenses.tableRows).toHaveCount(totalCount);
  });

  // Negative 7 — Add button toggles the form; closing it without saving leaves count unchanged
  test('opening and immediately closing the add-expense form does not change row count', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const countBefore = await expenses.tableRows.count();

    // Open the form
    await expenses.openAddForm();
    await expect(expenses.newExpenseForm).toBeVisible();

    // Close it by clicking the button again (toggle)
    await expenses.addExpenseButton.click();
    await expect(expenses.newExpenseForm).not.toBeVisible();

    // Row count must be unchanged
    await expect(expenses.tableRows).toHaveCount(countBefore);
  });
});
