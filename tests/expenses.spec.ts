import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses tab — critical flow tests.
 *
 * Covers:
 *   Test 2 — Adding a new expense via the form makes it appear in the table.
 *   Test 3 — Searching by description narrows results; a non-matching term
 *             shows the "No transactions found" empty state.
 *
 * Neither of these flows was previously tested. The Expenses tab (search,
 * add, sort, filter) was completely absent from the test suite.
 */

test.describe('Expenses tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Navigate to the Expenses tab
    await new PageFactory(page).expenses().navigate();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  // Test 2 — Add a new expense via the form
  test('adding a new expense through the form makes it appear in the transactions table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Open the add-expense form
    await expenses.openAddForm();

    // Fill in description and amount; category defaults to "Food" which is fine
    const uniqueDesc = 'Playwright test coffee';
    await expenses.formDescription.fill(uniqueDesc);
    await expenses.formAmount.fill('12.50');

    // Submit — the form's Save button dispatches ADD_TRANSACTION
    await expenses.formSaveButton.click();

    // The new row should now appear in the table
    await expect(page.getByRole('cell', { name: uniqueDesc })).toBeVisible();
  });

  // Test 3 — Search filters the transaction list; no match shows empty state
  test('searching transactions by description filters the list; an unmatched term shows the empty state', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Search for a known category word to confirm filtering works (positive path)
    await expenses.search('Rent');
    await expect(page.getByRole('cell', { name: /Rent/i }).first()).toBeVisible();

    // Now search for something that cannot match any seeded transaction
    await expenses.search('zzznoresults999');
    await expect(expenses.emptyState).toBeVisible();

    // After clearing, transactions come back
    await expenses.clearSearch();
    await expect(expenses.emptyState).not.toBeVisible();
  });
});
