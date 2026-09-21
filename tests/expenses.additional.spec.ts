import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Additional tests for the Expenses section.
 *
 * expenses.spec.ts (in this PR) covers:
 *   - adding a new expense
 *   - real-time search filter
 *
 * This file covers the remaining untested Expenses flows:
 *   6. Category filter dropdown narrows the table to matching rows.
 *   7. Searching with a non-matching term shows the "No transactions found"
 *      empty state and the table body has no data rows.
 *   8. Sorting by Amount descending produces a correctly ordered table.
 */

test.describe('Expenses — additional flows', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expenses = factory.expenses();
    await expenses.navigate();

    // Use March (default selected month) for a consistent data set
    await expenses.selectMonth('Mar');
  });

  // ── Test 6 ──────────────────────────────────────────────────────────
  // Selecting "Food" from the category filter dropdown must show only Food
  // rows. Each visible category badge in the table must say "Food".
  test('category filter shows only matching category rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Total rows before filtering (should be > 0 for March seeded data)
    const totalCount = await expenses.tableRows.count();
    expect(totalCount).toBeGreaterThan(0);

    // Select the "Food" category from the filter dropdown (first combobox in the filter bar)
    await expenses.categoryFilter.selectOption('Food');

    // The filtered count must be smaller than the unfiltered total
    const filteredCount = await expenses.tableRows.count();
    expect(filteredCount).toBeLessThan(totalCount);
    expect(filteredCount).toBeGreaterThan(0);

    // Every visible category badge must contain "Food"
    const categoryBadges = page.locator('tbody tr td').filter({ hasText: /Food/ });
    await expect(categoryBadges).toHaveCount(filteredCount);
  });

  // ── Test 7 ──────────────────────────────────────────────────────────
  // Searching for a term that matches no transaction must:
  //   a) Show zero table body rows.
  //   b) Render the "No transactions found" empty-state cell.
  //   c) Show a footer total of $0.00.
  test('no-match search shows empty state and zero total', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Search for a string that cannot match any real description or category
    await expenses.search('zzz_no_match_zzz');

    // The data rows must disappear
    await expect(expenses.tableRows).toHaveCount(0);

    // The empty-state cell must be visible
    await expect(page.getByText('No transactions found')).toBeVisible();

    // Footer total must show $0.00
    await expect(expenses.tableFooter).toContainText('$0.00');
  });

  // ── Test 8 ──────────────────────────────────────────────────────────
  // Clicking the Amount column header sorts the table descending by amount;
  // the first row's amount must be ≥ the second row's amount.
  test('clicking Amount column header sorts rows by amount descending', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Click the Amount header to sort descending
    await expenses.sortBy('Amount');

    // Wait for the table to settle after sorting
    await expect(expenses.tableRows.first()).toBeVisible();

    // Read the amount cells (last column, formatted as "-$X.XX")
    const amountCells = page.locator('tbody tr td:last-child');
    const count = await amountCells.count();
    expect(count).toBeGreaterThan(1);

    const parseAmt = (text: string) =>
      parseFloat(text.replace(/[^0-9.]/g, ''));

    const firstAmt  = parseAmt((await amountCells.nth(0).textContent()) ?? '0');
    const secondAmt = parseAmt((await amountCells.nth(1).textContent()) ?? '0');

    // First row must have an amount ≥ the second row (descending order)
    expect(firstAmt).toBeGreaterThanOrEqual(secondAmt);
  });
});
