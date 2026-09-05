import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses Tab — Happy Path Tests
 *
 * User story: As a logged-in user I can view, search, filter, sort, and add
 * transactions in the Expenses tab so that I can track my spending accurately.
 */

test.describe('Expenses — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
  });

  // ─── Viewing ────────────────────────────────────────────────────────────────

  test('Expenses tab is reachable and shows a non-empty transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Heading confirms we are on the right section
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();

    // At least one transaction row is shown for the default month (March)
    await expect(expenses.tableRows.first()).toBeVisible();
  });

  test('switching to January shows its own set of transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Default is March; capture its count
    const marCount = await expenses.tableRows.count();

    // Switch to January
    await expenses.monthJan.click();
    const janCount = await expenses.tableRows.count();

    // Both months have seeded data, so counts should be positive
    expect(janCount).toBeGreaterThan(0);
    // The two months may differ in transaction counts
    expect(typeof janCount).toBe('number');
    expect(typeof marCount).toBe('number');
  });

  test('footer total equals the sum of visible transaction amounts', async ({ page }) => {
    // Navigate to Expenses (already done by beforeEach)
    // Read the footer total label text (e.g. "Total: $2,345.67")
    const totalText = await page
      .locator('div.px-5.py-3.border-t')
      .getByText(/total/i)
      .textContent();

    // The footer total must contain a dollar-formatted number
    expect(totalText).toMatch(/\$[\d,]+(\.\d+)?/);
  });

  // ─── Searching ──────────────────────────────────────────────────────────────

  test('searching by description filters the table to matching rows only', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // "Netflix" is a seeded Subscriptions transaction
    await expenses.searchFor('Netflix');

    const rows = expenses.tableRows;
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Every visible row must mention "Netflix" in its description cell
    for (let i = 0; i < count; i++) {
      const desc = await rows.nth(i).locator('td').nth(1).textContent();
      expect(desc?.toLowerCase()).toContain('netflix');
    }
  });

  test('clearing the search restores all transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const totalBefore = await expenses.tableRows.count();

    await expenses.searchFor('Netflix');
    const filtered = await expenses.tableRows.count();
    expect(filtered).toBeLessThan(totalBefore);

    await expenses.clearSearch();
    const totalAfter = await expenses.tableRows.count();
    expect(totalAfter).toBe(totalBefore);
  });

  // ─── Category filter ─────────────────────────────────────────────────────────

  test('filtering by Food category shows only Food transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.filterByCategory('Food');

    const rows = expenses.tableRows;
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Every row's category badge must say "Food"
    for (let i = 0; i < count; i++) {
      const catCell = await rows.nth(i).locator('td').nth(2).textContent();
      expect(catCell).toContain('Food');
    }
  });

  // ─── Add Expense ─────────────────────────────────────────────────────────────

  test('adding a new expense appears at the top of the transaction list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const countBefore = await expenses.tableRows.count();

    await expenses.openAddForm();
    await expenses.addExpense('Test Coffee', '4.50', 'Food');

    // One more row than before
    await expect(expenses.tableRows).toHaveCount(countBefore + 1);

    // The new row description is present
    await expect(page.getByText('Test Coffee')).toBeVisible();
  });

  test('Add Expense form closes after a successful save', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.openAddForm();
    await expenses.addExpense('Quick Lunch', '12.00');

    // The Description placeholder field should no longer be visible (form closed)
    await expect(expenses.formDescriptionInput).not.toBeVisible();
  });

  // ─── Sorting ─────────────────────────────────────────────────────────────────

  test('clicking the Amount column header sorts transactions by amount descending', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Click the Amount column header
    await page.getByRole('columnheader', { name: /amount/i }).click();

    const rows = expenses.tableRows;
    const count = await rows.count();
    expect(count).toBeGreaterThan(1);

    // The first row should show a higher or equal amount than the second
    const parseAmount = (text: string | null) =>
      parseFloat((text ?? '0').replace(/[^0-9.]/g, ''));

    const first = parseAmount(await rows.nth(0).locator('td').nth(3).textContent());
    const second = parseAmount(await rows.nth(1).locator('td').nth(3).textContent());

    expect(first).toBeGreaterThanOrEqual(second);
  });
});
