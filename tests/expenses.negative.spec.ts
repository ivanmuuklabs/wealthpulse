import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses — search, filter, and negative-path coverage.
 *
 * expenses.settings.spec.ts already covers the "add expense" happy path.
 * These tests target the filtering and empty-state flows that were completely absent:
 *  - Search by description filters the transaction table
 *  - Clearing the search restores all rows
 *  - A no-match search term shows the empty state
 *  - Category filter shows only matching-category rows
 */

test.describe('Expenses — search, filter, and empty state', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Navigate to the Expenses tab
    await new PageFactory(page).expenses().navigate();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  // ── Test 1 ────────────────────────────────────────────────────────────────
  // Searching by a description keyword filters the table to matching rows only.
  test('searching by description keyword filters the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Read the full row count before searching
    const allRows = page.locator('tbody tr');
    const totalCount = await allRows.count();
    expect(totalCount).toBeGreaterThan(0);

    // Search for a term that exists in the seeded data — "rent" appears in Housing
    await expenses.search('rent');

    // Table must now show fewer rows
    const filteredCount = await allRows.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(totalCount);

    // Every visible description must contain the search term (case-insensitive)
    const descriptions = await expenses.getTransactionDescriptions();
    for (const desc of descriptions) {
      expect(desc.toLowerCase()).toContain('rent');
    }
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────
  // Clearing the search input restores all seeded rows.
  test('clearing the search restores all transaction rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Get baseline row count
    const allRows = page.locator('tbody tr');
    const totalCount = await allRows.count();

    // Filter down
    await expenses.search('rent');
    const filteredCount = await allRows.count();
    expect(filteredCount).toBeLessThan(totalCount);

    // Clear and confirm rows are back
    await expenses.search('');
    const restoredCount = await allRows.count();
    expect(restoredCount).toBe(totalCount);
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────
  // A search term that matches nothing shows the "No transactions found" empty state.
  test('no-match search term shows the empty-state message', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Search with a term guaranteed to match nothing
    await expenses.search('xxxxthiscannotmatch');

    // The table rows should be gone and the empty-state message must appear
    await expect(expenses.emptyState).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(0);
  });

  // ── Test 4 ────────────────────────────────────────────────────────────────
  // Category filter shows only rows matching the selected category.
  test('selecting a category filter hides all non-matching transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Filter by Housing category
    await expenses.filterByCategory('Housing');

    // Every visible row must belong to the Housing category
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Check the category cell (3rd column) of each visible row
    for (let i = 0; i < rowCount; i++) {
      const categoryCell = rows.nth(i).locator('td').nth(2);
      await expect(categoryCell).toHaveText('Housing');
    }
  });
});
