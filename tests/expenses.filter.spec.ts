import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses — filter & search flows not covered by expenses.spec.ts.
 *
 * Test A: Typing in the search box filters rows to only matching descriptions.
 * Test B: Selecting a category from the dropdown hides rows from other categories.
 * Test C: A search term that matches nothing surfaces the "No transactions found"
 *          empty-state row instead of table data.
 */

test.describe('Expenses — search & filter', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    const expenses = factory.expenses();
    await expenses.navigate();
    // Confirm the Expenses heading is visible before each test
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  // Test A — Text search narrows the table
  test('typing in the search box shows only rows whose description matches', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Seeded data contains "Rent payment" in the Housing category
    await expenses.searchFor('Rent');

    // At least one row must remain, and every visible description must contain "Rent"
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    for (let i = 0; i < rowCount; i++) {
      const rowText = await rows.nth(i).textContent();
      expect(rowText?.toLowerCase()).toContain('rent');
    }
  });

  // Test B — Category dropdown filter
  test('selecting a category from the dropdown shows only transactions from that category', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.filterByCategory('Housing');

    // Every row in the table should carry the Housing category badge
    const categoryBadges = page.locator('table tbody tr td').filter({ hasText: 'Housing' });
    const rows = page.locator('table tbody tr');

    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Number of Housing badge cells must equal number of rows (each row = one Housing txn)
    await expect(categoryBadges).toHaveCount(rowCount);
  });

  // Test C — No results empty state
  test('a search term that matches nothing shows the "No transactions found" message', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Use a string that cannot match any seeded description, category, or date
    await expenses.searchFor('xxxxxxxxxnotransaction');

    await expect(expenses.noResultsRow).toBeVisible();
    // Table body should contain a single "no results" row, no data rows
    const dataRows = page.locator('table tbody tr');
    await expect(dataRows).toHaveCount(1);
  });
});
