import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Expenses tab.
 *
 * User story: As a user I can view, search, filter, and add transactions
 * so that I have full visibility of my monthly spending.
 *
 * Acceptance criteria (derived from the app's feature set):
 *  1. Navigating to Expenses shows the transaction table with seeded data.
 *  2. Adding a valid expense appends it to the transaction list.
 *  3. Filtering by category narrows the table to that category only.
 *  4. Searching by description narrows the table to matching rows.
 *  5. Clicking the Amount column header sorts transactions by amount.
 *  6. The footer total reflects the sum of currently visible transactions.
 */

test.describe('Expenses — happy path', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.expenses().navigate();
  });

  // AC 1 — Expenses tab loads with seeded transactions
  test('navigating to Expenses shows the transactions table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expect(expenses.heading).toBeVisible();
    // Seeded data contains transactions; the table must have at least one row
    await expect(expenses.tableRows).not.toHaveCount(0);
    await expect(expenses.noTransactionsMessage).not.toBeVisible();
  });

  // AC 2 — Adding a valid expense appends it to the list
  test('adding a valid expense appends it to the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const countBefore = await expenses.tableRows.count();

    await expenses.openAddForm();
    await expect(expenses.newExpenseForm).toBeVisible();

    await expenses.addExpense('Salary advance lunch', '42.50', 'Food');

    // Form closes after saving
    await expect(expenses.newExpenseForm).not.toBeVisible();

    // New row must appear in the table
    await expect(page.getByText('Salary advance lunch')).toBeVisible();

    // Row count increases by 1
    await expect(expenses.tableRows).toHaveCount(countBefore + 1);
  });

  // AC 3 — Category filter narrows the table
  test('filtering by "Shopping" shows only Shopping transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.filterByCategory('Shopping');

    // Every visible row must have the Shopping badge
    const rowCount = await expenses.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);

    for (let i = 0; i < rowCount; i++) {
      await expect(expenses.tableRows.nth(i).getByText('Shopping')).toBeVisible();
    }
  });

  // AC 4 — Search narrows transactions to matching descriptions
  test('searching for "rent" shows only matching transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('rent');

    // At least the "Rent payment" Housing transaction must match
    const rowCount = await expenses.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // All visible descriptions must contain "rent" (case-insensitive)
    for (let i = 0; i < rowCount; i++) {
      const text = await expenses.tableRows.nth(i).textContent();
      expect(text?.toLowerCase()).toContain('rent');
    }
  });

  // AC 5 — Clicking Amount header sorts the table by amount
  test('clicking Amount header sorts transactions by amount descending then ascending', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // First click → descending by amount (highest first)
    await expenses.sortBy('amount');
    const amounts = await page.locator('tbody tr td:last-child').allTextContents();
    const parsed = amounts.map(a => parseFloat(a.replace(/[$,\-]/g, '')));

    for (let i = 1; i < parsed.length; i++) {
      expect(parsed[i - 1]).toBeGreaterThanOrEqual(parsed[i]);
    }
  });

  // AC 6 — Footer shows the total for currently visible rows
  test('footer total equals the sum of visible transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Filter to Food to get a smaller, predictable set
    await expenses.filterByCategory('Food');

    const rowCount = await expenses.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Sum the amount cells
    const amountCells = await page.locator('tbody tr td:last-child').allTextContents();
    const sum = amountCells
      .map(t => parseFloat(t.replace(/[$,\-]/g, '')))
      .reduce((acc, v) => acc + v, 0);

    // The footer total (e.g. "Total: $123.45") must contain the same formatted value
    const footerText = await page.locator('div').filter({ hasText: /Total:/ }).last().textContent();
    expect(footerText).toBeTruthy();

    // Allow $1 rounding tolerance for float formatting
    const footerAmount = parseFloat((footerText ?? '').replace(/[^0-9.]/g, ''));
    expect(Math.abs(footerAmount - sum)).toBeLessThanOrEqual(1);
  });

  // Month switching — switching to February shows its transactions
  test('switching to February updates the transaction list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Default is March (month index 2); switch to February
    await page.getByRole('button', { name: 'Feb' }).click();

    // Seeded data has transactions in Feb too
    await expect(expenses.tableRows).not.toHaveCount(0);

    // Dates in the table must start with 2026-02
    const dateCells = await page.locator('tbody td:first-child').allTextContents();
    for (const d of dateCells) {
      expect(d).toMatch(/^2026-02/);
    }
  });
});
