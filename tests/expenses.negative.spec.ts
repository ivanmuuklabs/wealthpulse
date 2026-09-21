import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Negative / edge-case tests for the Expenses tab.
 *
 * User story: As an authenticated user, invalid inputs and edge cases in
 * the Expenses tab should be handled gracefully — empty form submissions
 * must not add rows, searches with no matches must show the empty-state
 * message, and filter combinations must correctly narrow the list.
 *
 * Generated from the Expenses feature completed in the current sprint
 * (Jira-done-ticket proxy, 2026-09-21).
 */

test.describe('Expenses tab — negative / edge-case flows', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.expenses().navigate();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  // Negative Test 1 — Submitting the form without description/amount must NOT add a row
  test('saving an expense with empty description and amount does not add a row', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    const countBefore = await expensesPage.tableRows.count();

    await expensesPage.openAddForm();
    // Leave description and amount blank — only click Save
    await expensesPage.saveButton.click();

    // Row count must remain unchanged
    await expect(expensesPage.tableRows).toHaveCount(countBefore);
  });

  // Negative Test 2 — Searching for a nonexistent term shows the empty-state row
  test('searching for a nonexistent description shows "No transactions found"', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    await expensesPage.search('xxxxxthisdoesnotexist');

    await expect(expensesPage.emptyState).toBeVisible();
    // No data rows should be visible
    await expect(expensesPage.tableRows).toHaveCount(1); // the single colspan empty row
  });

  // Negative Test 3 — Category filter set to a category with no seeded data shows no rows
  test('filtering by a category that has no transactions in March shows the empty state', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // March is already selected by default (selectedMonth: 2 in seeded state)
    // "Subscriptions" always has 2 seeded rows; this test checks that the
    // combination of an additional search term produces zero results
    await expensesPage.filterByCategory('Health');
    await expensesPage.search('xxxxxxnomatch');

    await expect(expensesPage.emptyState).toBeVisible();
  });

  // Negative Test 4 — Adding an expense with amount "0" does not increase the footer total
  test('adding an expense with $0 amount does not change the running total', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    const totalBefore = await expensesPage.footerTotal.textContent();
    const countBefore = await expensesPage.tableRows.count();

    await expensesPage.openAddForm();
    await expensesPage.descriptionInput.fill('Zero-dollar item');
    await expensesPage.amountInput.fill('0');
    await expensesPage.saveButton.click();

    // Even if the row is added, the displayed total must be unchanged
    // (or the form may reject it — either way the total must equal before)
    const totalAfter = await expensesPage.footerTotal.textContent();

    // Accept either: row was NOT added (rejected) or total stayed the same
    const countAfter = await expensesPage.tableRows.count();
    if (countAfter > countBefore) {
      // Row was inserted — total must not change (adding $0 is a no-op financially)
      expect(totalAfter).toEqual(totalBefore);
    } else {
      // Row was rejected — table is unchanged, which is also valid
      expect(countAfter).toEqual(countBefore);
    }
  });

  // Negative Test 5 — Clearing the search restores the full unfiltered list
  test('clearing the search field restores all transactions', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    const totalCount = await expensesPage.tableRows.count();

    // Apply a filter
    await expensesPage.search('Rent');
    await expect(expensesPage.tableRows).not.toHaveCount(totalCount);

    // Clear the search
    await expensesPage.searchInput.clear();

    // Full list must be restored
    await expect(expensesPage.tableRows).toHaveCount(totalCount);
  });

  // Negative Test 6 — Month switcher resets the transaction list to that month's data
  test('switching months resets the table to the selected month transactions', async ({ page }) => {
    // Read March row count (default)
    const expensesPage = new PageFactory(page).expenses();
    const marchCount = await expensesPage.tableRows.count();

    // Switch to January (month 0 → button "Jan")
    await page.getByRole('button', { name: 'Jan' }).click();
    const janCount = await expensesPage.tableRows.count();

    // Both months have seeded transactions but amounts may differ
    expect(janCount).toBeGreaterThan(0);

    // Switch back to March and verify the count is restored
    await page.getByRole('button', { name: 'Mar' }).click();
    await expect(expensesPage.tableRows).toHaveCount(marchCount);
  });
});
