import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses tab — negative and edge-case flows
 *
 * The happy-path tests in expenses.spec.ts cover:
 *   add expense, category filter, keyword search.
 *
 * This file covers the missing failure modes and edge cases:
 *   1. Submitting the form with an empty description does NOT add a row
 *   2. Submitting the form with an empty amount does NOT add a row
 *   3. Searching for a non-existent term shows the empty state
 *   4. Clearing the search restores the full transaction list
 *   5. Sorting by Amount (descending) puts the highest amount first
 */

test.describe('Expenses — negative and edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Expenses tab before each test
    await new PageFactory(page).expenses().navigate();
  });

  // ── Test 1 — Empty description prevents row insertion ────────────────────
  test('saving the form with an empty description does not add a new row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Count rows before attempting to add
    const countBefore = await expenses.transactionRows.count();

    // Open the form and fill only the amount — leave description blank
    await expenses.openAddForm();
    await expenses.formAmount.fill('25.00');
    await expenses.formSaveButton.click();

    // Row count must stay the same (app guard: `if (!fDesc || !fAmt) return;`)
    const countAfter = await expenses.transactionRows.count();
    expect(countAfter).toBe(countBefore);
  });

  // ── Test 2 — Empty amount prevents row insertion ─────────────────────────
  test('saving the form with an empty amount does not add a new row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const countBefore = await expenses.transactionRows.count();

    // Open the form and fill only the description — leave amount blank
    await expenses.openAddForm();
    await expenses.formDescription.fill('Should not be added');
    // Explicitly clear the amount field to ensure it is empty
    await expenses.formAmount.clear();
    await expenses.formSaveButton.click();

    const countAfter = await expenses.transactionRows.count();
    expect(countAfter).toBe(countBefore);
  });

  // ── Test 3 — No-match search shows empty state ───────────────────────────
  test('searching for a term that matches no transactions shows the empty state', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Use a string that will never appear in seeded descriptions
    await expenses.search('zzz-no-match-zzz');

    // The "No transactions found" empty-state row should appear
    await expect(expenses.noResultsRow).toBeVisible();

    // No real transaction rows should be present
    await expect(expenses.transactionRows).toHaveCount(0);
  });

  // ── Test 4 — Clearing search restores the full list ─────────────────────
  test('clearing the search field restores all seeded transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Record the baseline row count
    const baselineCount = await expenses.transactionRows.count();

    // Filter to no results, then clear
    await expenses.search('zzz-no-match-zzz');
    await expect(expenses.noResultsRow).toBeVisible();

    await expenses.search(''); // clear the search field

    // Row count should return to the baseline
    const restoredCount = await expenses.transactionRows.count();
    expect(restoredCount).toBe(baselineCount);
  });

  // ── Test 5 — Sorting by Amount (descending) ──────────────────────────────
  test('clicking the Amount column header sorts transactions highest-first', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Click the Amount column header to sort descending
    await page.getByRole('columnheader', { name: /amount/i }).click();

    // Read the amounts of the first two rows and verify descending order
    const getAmount = async (rowIndex: number): Promise<number> => {
      const text = await expenses.transactionRows.nth(rowIndex).locator('td').last().textContent();
      return parseFloat((text ?? '0').replace(/[^0-9.]/g, ''));
    };

    const first = await getAmount(0);
    const second = await getAmount(1);

    // First row's amount must be >= second row's amount (sorted desc)
    expect(first).toBeGreaterThanOrEqual(second);
  });
});
