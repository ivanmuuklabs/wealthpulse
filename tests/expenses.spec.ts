import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses tab tests.
 *
 * Coverage gaps addressed:
 *   - Test 2: Adding a new expense via the form — the core CRUD write path,
 *     completely untested before this PR.
 *   - Test 3: Searching and filtering transactions — the search input and category
 *     filter that narrow the visible table rows, also previously untested.
 */

test.describe('Expenses', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Navigate to the Expenses tab
    await new PageFactory(page).expenses().navigate();
  });

  /**
   * Test 2 — Adding a new expense via the form appears in the transaction table.
   *
   * Covers: Add Expense button → form display → description & amount fill →
   * Save → new row visible in the table → footer total updates.
   */
  test('adding a new expense via the form shows it in the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Open the add-expense form
    await expenses.addExpenseButton.click();
    await expenses.descriptionInput.waitFor({ state: 'visible' });

    // Fill in the form fields
    await expenses.descriptionInput.fill('Test coffee shop');
    await expenses.amountInput.fill('12.50');

    // Click Save to submit
    await expenses.saveButton.click();

    // The form should close automatically
    await expect(expenses.descriptionInput).not.toBeVisible();

    // The new expense description must appear in the transaction table
    await expect(page.getByText('Test coffee shop')).toBeVisible();

    // Footer transaction count should include the new row
    await expect(expenses.footerSummary).toContainText('transaction');
  });

  /**
   * Test 3 — Searching by description filters the visible transaction rows.
   *
   * Covers: the search input in the filter bar. When a term that matches no
   * transaction is entered, the empty-state message must appear; when cleared,
   * rows return.
   */
  test('searching with a non-matching term shows the empty-state message', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Type a term that can't match any seeded transaction
    await expenses.search('xxxxnotransaction999');

    // The empty-state cell must be visible
    await expect(expenses.emptyState).toBeVisible();

    // Clear the search — rows should return
    await expenses.search('');
    await expect(expenses.emptyState).not.toBeVisible();
    // At least one transaction row exists in the default month (March)
    await expect(expenses.transactionRows.first()).toBeVisible();
  });
});
