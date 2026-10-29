import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Negative and edge-case tests for the Expenses tab.
 *
 * User story: As a user the system should prevent me from adding
 * incomplete expense entries and should gracefully handle searches
 * and filters that produce no results.
 */

test.describe('Expenses — negative / edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expensesPage = factory.expenses();
    await expensesPage.navigate();
    await expect(expensesPage.heading).toBeVisible();
  });

  // ── Invalid form submissions ────────────────────────────────────────────

  test('submitting the form with an empty description does not add a row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const before = await expenses.transactionRows.count();

    await expenses.openForm();
    // Leave description empty, enter a valid amount
    await expenses.amountInput.fill('25.00');
    await expenses.saveButton.click();

    // Row count should remain the same
    await expect(expenses.transactionRows).toHaveCount(before);
  });

  test('submitting the form with an empty amount does not add a row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const before = await expenses.transactionRows.count();

    await expenses.openForm();
    // Enter a description but leave amount blank
    await expenses.descriptionInput.fill('No Amount Expense');
    await expenses.saveButton.click();

    // Row count should remain the same
    await expect(expenses.transactionRows).toHaveCount(before);
  });

  test('submitting the form with both fields empty does not add a row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const before = await expenses.transactionRows.count();

    await expenses.openForm();
    // Click Save without filling anything
    await expenses.saveButton.click();

    await expect(expenses.transactionRows).toHaveCount(before);
  });

  // ── Search producing no results ─────────────────────────────────────────

  test('search with a term matching no transaction shows "No transactions found"', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('xxxxxxnotanexpense9999');

    await expect(expenses.noTransactionsMessage).toBeVisible();
    // Table body should have no data rows
    await expect(expenses.transactionRows).toHaveCount(0);
  });

  test('search result count drops to zero for a non-matching term', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('xxxxxxnotanexpense9999');

    const countText = await expenses.transactionCount.textContent();
    expect(countText).toContain('0 transaction');
  });

  // ── Category filter with narrow results ─────────────────────────────────

  test('filtering by Housing shows only one transaction (fixed seeded count)', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.filterByCategory('Housing');

    // Housing has exactly 1 transaction per month in the seed
    const count = await expenses.transactionRows.count();
    expect(count).toBe(1);
  });

  // ── Combined search + category filter ───────────────────────────────────

  test('search combined with category filter that has no overlap shows empty state', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Filter to Housing (rent only), then search for something that won't be there
    await expenses.filterByCategory('Housing');
    await expenses.search('Grocery run');

    await expect(expenses.noTransactionsMessage).toBeVisible();
  });

  // ── Sort stability ────────────────────────────────────────────────────────

  test('clicking Amount header twice reverses to ascending order', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // First click → descending
    await expenses.sortBy('amount');
    // Second click → ascending
    await expenses.sortBy('amount');

    const rows = expenses.transactionRows;
    const count = await rows.count();

    const amounts: number[] = [];
    for (let i = 0; i < Math.min(count, 10); i++) {
      const cell = rows.nth(i).locator('td').last();
      const text = await cell.textContent();
      const value = parseFloat((text ?? '0').replace(/[^0-9.]/g, ''));
      amounts.push(value);
    }

    // Should be non-decreasing after two clicks (ascending)
    for (let i = 1; i < amounts.length; i++) {
      expect(amounts[i]).toBeGreaterThanOrEqual(amounts[i - 1]);
    }
  });

  // ── January (month with no data in range) ────────────────────────────────

  test('switching to January still shows transactions (seed includes Jan data)', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await page.getByRole('button', { name: 'Jan' }).click();

    // January is included in the seed; there should be rows
    const count = await expenses.transactionRows.count();
    expect(count).toBeGreaterThan(0);
  });

  // ── Form toggle ────────────────────────────────────────────────────────

  test('clicking Add Expense twice toggles the form closed without adding a row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const before = await expenses.transactionRows.count();

    // Open
    await expenses.openForm();
    await expect(expenses.newExpenseForm).toBeVisible();

    // Close by clicking the same button again
    await expenses.addExpenseButton.click();
    await expect(expenses.newExpenseForm).not.toBeVisible();

    // No row added
    await expect(expenses.transactionRows).toHaveCount(before);
  });
});
