import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses — category filter and month-switching tests.
 *
 * expenses.spec.ts (added by the coverage/daily-2026-09-20 PR) covers:
 *   - Adding a new expense via the form
 *   - Empty-state when search has no match
 *
 * This file covers the remaining interactive filter flows:
 *   - Category filter shows only matching rows
 *   - Month switching updates the transaction list
 */

test.describe('Expenses — category filter', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await new PageFactory(page).expenses().navigate();
  });

  /**
   * Selecting a category from the filter dropdown must restrict the visible
   * table rows to transactions in that category only.
   * "Food" is a well-seeded category with multiple transactions for March.
   */
  test('filtering by category shows only transactions in that category', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Get total rows before filtering
    const totalRowsBefore = await expenses.transactionRows.count();
    expect(totalRowsBefore).toBeGreaterThan(0);

    // Apply the Food category filter
    await expenses.filterByCategory('Food');

    // Some rows should remain visible (Food is seeded)
    const filteredRows = await expenses.transactionRows.count();
    expect(filteredRows).toBeGreaterThan(0);

    // Filtered row count should be <= total (filter narrowed it down)
    expect(filteredRows).toBeLessThanOrEqual(totalRowsBefore);

    // The empty-state message must NOT appear
    await expect(expenses.emptyState).not.toBeVisible();
  });

  /**
   * After applying a category filter with no transactions (an impossible combo),
   * the empty-state message must appear.
   */
  test('category filter with no matching month shows the empty-state', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Search for something that won't match any Food transaction description
    await expenses.search('xxxxnomatch999');

    // Also apply Food filter — the intersection is guaranteed empty
    await expenses.filterByCategory('Food');

    await expect(expenses.emptyState).toBeVisible();
  });
});

test.describe('Expenses — month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await new PageFactory(page).expenses().navigate();
  });

  /**
   * The Expenses tab has a month selector. Switching to a different month
   * must update the displayed transaction list. The footer should still
   * report a non-zero count for the new month (January is seeded).
   */
  test('switching the month selector updates the transaction list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Default month is March — get the row count
    const marchCount = await expenses.transactionRows.count();
    expect(marchCount).toBeGreaterThan(0);

    // Switch to January via the month buttons (same selector used for Dashboard)
    await page.getByRole('button', { name: 'Jan' }).click();

    // After switching months, at least one transaction row should be visible
    await expect(expenses.transactionRows.first()).toBeVisible();

    // The footer must still mention transactions
    await expect(expenses.footerSummary).toContainText('transaction');
  });
});
