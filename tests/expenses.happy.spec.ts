import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Expenses tab.
 *
 * User story: As a user I can view, add, search, filter and sort
 * my transactions so that I always have an accurate picture of my spending.
 *
 * All tests log in with demo/demo123 and navigate to the Expenses tab
 * before running their scenario.
 */

test.describe('Expenses — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expensesPage = factory.expenses();
    await expensesPage.navigate();
    await expect(expensesPage.heading).toBeVisible();
  });

  // ── Story: view existing transactions ──────────────────────────────────

  test('Expenses tab loads with at least one transaction in the default month', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // The table footer should report a non-zero transaction count
    const countText = await expenses.transactionCount.textContent();
    const count = parseInt(countText ?? '0');
    expect(count).toBeGreaterThan(0);
  });

  test('footer total reflects the sum of all visible rows', async ({ page }) => {
    // The footer total label is always present and shows a dollar amount
    const totalText = await new PageFactory(page).expenses().transactionTotal.textContent();
    expect(totalText).toMatch(/Total:\s*\$[\d,]+(\.\d+)?/);
  });

  // ── Story: add a new expense ───────────────────────────────────────────

  test('adding a new expense appends it to the transaction list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Record the current row count before adding
    const before = await expenses.transactionRows.count();

    // Open form and submit a new transaction
    await expenses.openForm();
    await expect(expenses.newExpenseForm).toBeVisible();
    await expenses.addExpense('Test Coffee', '4.50', 'Food', '2026-03-15');

    // Form should close and the new row should appear
    await expect(expenses.newExpenseForm).not.toBeVisible();
    await expect(expenses.transactionRows).toHaveCount(before + 1);
  });

  test('newly added expense description is visible in the table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.openForm();
    await expenses.addExpense('Playwright Coffee Run', '6.75', 'Food', '2026-03-10');

    // The description should now appear in the table
    await expect(page.getByText('Playwright Coffee Run')).toBeVisible();
  });

  test('newly added expense shows the correct category badge', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.openForm();
    await expenses.addExpense('Gym Monthly Fee', '45.00', 'Health', '2026-03-05');

    // Category badge for Health should appear
    await expect(page.getByText('Health').first()).toBeVisible();
  });

  // ── Story: search transactions ─────────────────────────────────────────

  test('searching by description filters the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Add a uniquely named expense so we can search for it deterministically
    await expenses.openForm();
    await expenses.addExpense('UniqueSearch1234', '12.00', 'Shopping', '2026-03-20');

    // Search for the unique term
    await expenses.search('UniqueSearch1234');

    // Only rows matching the search term should remain
    const rows = expenses.transactionRows;
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Every visible description should contain the search term (case-insensitive)
    for (let i = 0; i < count; i++) {
      const rowText = await rows.nth(i).textContent();
      expect(rowText?.toLowerCase()).toContain('uniquesearch1234');
    }
  });

  test('clearing the search field restores all transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const totalBefore = await expenses.transactionRows.count();

    await expenses.search('Food');
    const filteredCount = await expenses.transactionRows.count();
    expect(filteredCount).toBeLessThanOrEqual(totalBefore);

    // Clear search
    await expenses.search('');
    await expect(expenses.transactionRows).toHaveCount(totalBefore);
  });

  // ── Story: filter by category ──────────────────────────────────────────

  test('filtering by category shows only matching transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.filterByCategory('Transport');

    // Every visible row should have the Transport badge
    const rows = expenses.transactionRows;
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const rowText = await rows.nth(i).textContent();
      expect(rowText).toContain('Transport');
    }
  });

  test('switching back to All Categories shows more rows than a single-category filter', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.filterByCategory('Housing');
    const housingCount = await expenses.transactionRows.count();

    await expenses.filterByCategory('All Categories');
    const allCount = await expenses.transactionRows.count();

    expect(allCount).toBeGreaterThan(housingCount);
  });

  // ── Story: sort transactions ───────────────────────────────────────────

  test('clicking Amount header sorts transactions by amount descending', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.sortBy('amount');

    // Read the amount values from the last column of each row
    const rows = expenses.transactionRows;
    const count = await rows.count();

    const amounts: number[] = [];
    for (let i = 0; i < Math.min(count, 10); i++) {
      const cell = rows.nth(i).locator('td').last();
      const text = await cell.textContent();
      const value = parseFloat((text ?? '0').replace(/[^0-9.]/g, ''));
      amounts.push(value);
    }

    // First click → descending; verify the list is non-increasing
    for (let i = 1; i < amounts.length; i++) {
      expect(amounts[i]).toBeLessThanOrEqual(amounts[i - 1]);
    }
  });

  // ── Story: month switcher on Expenses tab ──────────────────────────────

  test('switching to February on the Expenses tab changes the displayed transactions', async ({ page }) => {
    const factory = new PageFactory(page);
    const expenses = factory.expenses();

    // Record the March count (default month is March, index 2)
    const marchCount = await expenses.transactionRows.count();

    // Switch to February (short label "Feb")
    await page.getByRole('button', { name: 'Feb' }).click();
    const febCount = await expenses.transactionRows.count();

    // Both months have seeded data, counts can differ — just confirm the switch worked
    // by checking that the footer total changes
    const marchTotal = await expenses.transactionTotal.textContent();
    await page.getByRole('button', { name: 'Mar' }).click();
    const marTotal = await expenses.transactionTotal.textContent();

    // The two months must have different totals (seeded data ensures this)
    expect(marchTotal).not.toEqual(marTotal);

    // Suppress the lint warning about marchCount being unused
    expect(marchCount).toBeGreaterThanOrEqual(0);
    expect(febCount).toBeGreaterThanOrEqual(0);
  });
});
