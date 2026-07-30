import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await factory.expenses().navigate();
});

// ─── Search ───────────────────────────────────────────────────────────────────

// Typing a specific description into the search box filters the table to only
// matching rows.
test('searching by description filters the expenses table', async ({ page }) => {
  const searchInput = page.getByPlaceholder(/search transactions/i);
  await expect(searchInput).toBeVisible();

  // Count rows before searching
  const totalRows = await page.locator('tbody tr').count();
  expect(totalRows).toBeGreaterThan(0);

  // Search for a term that exists in the seeded data
  await searchInput.fill('Netflix');

  // Only Netflix rows should be visible; "No transactions found" should NOT appear
  await expect(page.locator('tbody tr').filter({ hasText: /netflix/i }).first()).toBeVisible();
  await expect(page.getByText(/no transactions found/i)).not.toBeVisible();

  // Filtered count is less than (or equal to) the unfiltered count
  const filteredRows = await page.locator('tbody tr').count();
  expect(filteredRows).toBeLessThanOrEqual(totalRows);
});

// Searching for a term that cannot match any seeded transaction shows the
// empty-state row.
test('searching with a non-matching term shows the empty state', async ({ page }) => {
  const searchInput = page.getByPlaceholder(/search transactions/i);
  await searchInput.fill('zzz_no_match_zzz');

  await expect(page.getByText(/no transactions found/i)).toBeVisible();
});

// Clearing the search box restores all transactions
test('clearing the search restores all transactions', async ({ page }) => {
  const searchInput = page.getByPlaceholder(/search transactions/i);
  const initialCount = await page.locator('tbody tr').count();

  await searchInput.fill('Netflix');
  await searchInput.clear();

  // Row count is back to the original total
  const restoredCount = await page.locator('tbody tr').count();
  expect(restoredCount).toBe(initialCount);
});

// ─── Category filter ──────────────────────────────────────────────────────────

// Selecting a category from the filter dropdown shows only rows for that category.
test('category dropdown filter shows only matching category rows', async ({ page }) => {
  // The category filter <select> sits above the table
  const categorySelect = page.locator('select').filter({ hasText: /all categories/i });
  await expect(categorySelect).toBeVisible();

  await categorySelect.selectOption('Food');

  // Every visible row's category cell should be "Food"
  const rows = page.locator('tbody tr');
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);

  for (let i = 0; i < rowCount; i++) {
    await expect(rows.nth(i)).toContainText('Food');
  }
});

// Resetting the filter back to "All Categories" restores all rows
test('resetting category filter to All restores all rows', async ({ page }) => {
  const categorySelect = page.locator('select').filter({ hasText: /all categories/i });
  const initialCount = await page.locator('tbody tr').count();

  await categorySelect.selectOption('Housing');
  await categorySelect.selectOption('All');

  const restoredCount = await page.locator('tbody tr').count();
  expect(restoredCount).toBe(initialCount);
});

// ─── Column sorting ───────────────────────────────────────────────────────────

// Clicking the Amount column header sorts rows by amount descending first, then
// ascending on a second click.
test('clicking Amount column header sorts expenses by amount', async ({ page }) => {
  // Click the Amount header to sort descending
  await page.locator('th').filter({ hasText: /amount/i }).click();

  const rows = page.locator('tbody tr');
  const firstAmountDesc = await rows.first().locator('td').last().textContent();
  const lastAmountDesc = await rows.last().locator('td').last().textContent();

  // Parse amounts: "-$1,234.56" → 1234.56
  const parse = (txt: string | null) =>
    parseFloat((txt ?? '').replace(/[^0-9.]/g, ''));

  expect(parse(firstAmountDesc)).toBeGreaterThanOrEqual(parse(lastAmountDesc));

  // Click again to sort ascending
  await page.locator('th').filter({ hasText: /amount/i }).click();

  const firstAmountAsc = await rows.first().locator('td').last().textContent();
  const lastAmountAsc = await rows.last().locator('td').last().textContent();

  expect(parse(firstAmountAsc)).toBeLessThanOrEqual(parse(lastAmountAsc));
});

// ─── Summary footer ───────────────────────────────────────────────────────────

// The footer below the table always shows the transaction count and a formatted
// total amount.
test('expenses table footer shows transaction count and total', async ({ page }) => {
  // Footer lives outside <table> — it's a flex row below the overflow container
  const footer = page.locator('div').filter({ hasText: /transaction/ }).filter({ hasText: /total/i }).last();
  await expect(footer).toBeVisible();

  // After filtering to Food the count and total should update
  const categorySelect = page.locator('select').filter({ hasText: /all categories/i });
  await categorySelect.selectOption('Food');

  const footerAfterFilter = page.locator('div').filter({ hasText: /transaction/ }).filter({ hasText: /total/i }).last();
  await expect(footerAfterFilter).toBeVisible();
  await expect(footerAfterFilter).toContainText('transaction');
});
