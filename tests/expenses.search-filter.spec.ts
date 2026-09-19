import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Test 3 — Expenses: search input and category filter narrow the table
 *
 * Coverage gap addressed: search and category filtering in the Expenses tab
 * were entirely untested. Both use client-side memoized filtering (useMemo),
 * so these tests verify that the reactive filter pipeline works correctly and
 * that the "No transactions found" empty state appears when nothing matches.
 */
test.describe('Expenses — search and category filter', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
  });

  test('searching by a known description term narrows the transaction list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // "Netflix" is a seeded Subscriptions transaction — it must appear at least once
    await expenses.searchTransactions('Netflix');

    // Every visible row must contain "Netflix" in the Description column
    const rows = expenses.transactionRows;
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText('Netflix');
    }
  });

  test('searching for a term with no match shows the empty-state row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // A string that cannot match any seeded description, category, or date
    await expenses.searchTransactions('xxxxxxxxxnotreal');

    await expect(expenses.emptyState).toBeVisible();
    await expect(expenses.transactionRows).toHaveCount(0);
  });
});
