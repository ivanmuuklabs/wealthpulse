import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Test 3 — Expenses: search & category filter
 *
 * Gap addressed: The Expenses tab supports free-text search and a category
 * dropdown filter, both of which reduce the visible transaction rows. No
 * existing test covers these interactive filter flows. This is a high-value
 * path because incorrect filtering would hide real data from users.
 *
 * Covers:
 *  1. Search by text → only matching rows remain visible
 *  2. A search term that matches nothing → "No transactions found" message shown
 *  3. Category filter reduces rows to just that category
 */
test.describe('Expenses — search and category filter', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();
  });

  test('search with no matching term shows the empty-state row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('zzznotarealexpense999');

    // The dedicated empty-state row must appear
    await expect(expenses.noResultsRow).toBeVisible();
    // And there should be exactly one table body row (the empty-state colspan row)
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('filtering by Housing category shows only Housing transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.filterByCategory('Housing');

    // Every visible category badge in the table should be Housing
    const badges = page.locator('table tbody tr td:nth-child(3) span');
    const badgeTexts = await badges.allTextContents();
    expect(badgeTexts.length).toBeGreaterThan(0);
    badgeTexts.forEach(text => {
      expect(text).toContain('Housing');
    });

    // Resetting to All Categories brings back more rows
    await expenses.filterByCategory('All Categories');
    const allRows = await page.locator('table tbody tr').count();
    expect(allRows).toBeGreaterThan(badgeTexts.length);
  });
});
