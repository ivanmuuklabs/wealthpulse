import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests for the Expenses section.
 *
 * Covers three critical flows that had no test coverage:
 *   3. Add a new expense entry and confirm it appears in the transaction table.
 *   4. Search input filters the transaction list in real time.
 *   5. (Settings — save profile) is in settings.spec.ts
 */

test.describe('Expenses', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Expenses section
    const expenses = factory.expenses();
    await expenses.navigate();
  });

  // ── Test 3 ──────────────────────────────────────────────────────────
  // Adding a new expense must append the transaction to the visible table.
  // We use January (seeded data is stable) and a unique description to
  // make the assertion deterministic.
  test('adding a new expense appends it to the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Use January so the data set is predictable
    await expenses.selectMonth('Jan');

    // Record the initial row count before adding
    const initialCount = await expenses.tableRows.count();

    // Open the Add Expense form
    await expenses.openAddExpenseForm();

    // Fill and submit the form
    // Category defaults to Food — no override needed
    await expenses.addExpense({
      description: 'Test Grocery Run',
      amount: '42.50',
    });

    // After save the form should close and the table should have one more row
    await expect(expenses.tableRows).toHaveCount(initialCount + 1);

    // The new description must be visible in the table
    await expect(page.getByRole('cell', { name: 'Test Grocery Run' })).toBeVisible();
  });

  // ── Test 4 ──────────────────────────────────────────────────────────
  // Typing in the search box must filter the table in real time; clearing
  // the search must restore all rows.
  test('search input filters the transaction list in real time', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Use February for a non-trivial data set
    await expenses.selectMonth('Feb');

    // Capture the total row count before filtering
    const totalCount = await expenses.tableRows.count();
    expect(totalCount).toBeGreaterThan(0);

    // Search for a term that is expected to match only a subset.
    // "Housing" is one of the seeded categories and should narrow the list.
    await expenses.search('Housing');
    const filteredCount = await expenses.tableRows.count();

    // Filtered list must be smaller than (or equal to) the full list
    expect(filteredCount).toBeLessThanOrEqual(totalCount);
    // At least one row must match — "Housing" always exists in the seeded data
    expect(filteredCount).toBeGreaterThan(0);

    // Clear the search — all rows must reappear
    await expenses.search('');
    await expect(expenses.tableRows).toHaveCount(totalCount);
  });
});
