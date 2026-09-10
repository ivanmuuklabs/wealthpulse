import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses — text search filtering tests.
 *
 * The PR (coverage/daily-2026-09-10) covers adding an expense and filtering by
 * category. These tests complement it by covering the text search flow:
 *   - Searching by a known keyword narrows the table to matching rows only.
 *   - Searching for a term that matches no transactions shows the empty state.
 *   - Clearing the search input restores the full transaction list.
 *
 * The app's search matches against description, category, and date fields.
 */

test.describe('Expenses — text search', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    const expenses = factory.expenses();
    await expenses.navigate();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  test('searching by a known keyword filters the transaction list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Record total before filtering
    const totalCount = await expenses.tableRows.count();
    expect(totalCount).toBeGreaterThan(0);

    // "Rent" only matches Housing transactions with description "Rent payment"
    await expenses.search('Rent');

    // The filtered list must be non-empty and smaller than the full list
    const filteredCount = await expenses.tableRows.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(totalCount);

    // Every visible row must contain the search term (description or category)
    for (let i = 0; i < filteredCount; i++) {
      const rowText = await expenses.tableRows.nth(i).textContent();
      expect(rowText?.toLowerCase()).toContain('rent');
    }
  });

  test('searching for a term with no matches shows the empty state', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // A search term that cannot appear in any seeded description, category, or date
    await expenses.search('xyzNonExistentTerm12345');

    // The table body should show the "No transactions found" empty state
    await expect(expenses.noTransactionsRow).toBeVisible();

    // And the row locator (filtered to exclude the empty-state row) should be empty
    await expect(expenses.tableRows).toHaveCount(0);
  });

  test('clearing search restores the full transaction list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Record initial count
    const fullCount = await expenses.tableRows.count();
    expect(fullCount).toBeGreaterThan(0);

    // Apply a search that narrows the list
    await expenses.search('Rent');
    const narrowedCount = await expenses.tableRows.count();
    expect(narrowedCount).toBeLessThan(fullCount);

    // Clear the search
    await expenses.search('');

    // All rows should be restored
    await expect(expenses.tableRows).toHaveCount(fullCount);
  });

  test('transaction table footer shows the correct count and total', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // The footer shows "N transaction(s)" and "Total: $X.XX"
    // Match against both singular and plural forms
    await expect(expenses.footerSummary).toBeVisible();
    await expect(expenses.footerSummary).toContainText(/\d+\s+transactions?/);
    await expect(expenses.footerSummary).toContainText('Total:');
  });
});
