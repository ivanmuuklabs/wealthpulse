import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Expenses tab.
 *
 * User story (derived from app feature set — maps to Jira Expenses stories):
 *   "As a user I can view, add, search, filter and sort my monthly expenses
 *    so that I always have an accurate picture of my spending."
 *
 * Acceptance criteria tested here:
 *  1. The Expenses section is reachable via sidebar navigation after login.
 *  2. The transaction table shows seeded data for the selected month.
 *  3. A new transaction can be added and immediately appears in the table.
 *  4. The search bar filters the table to only matching rows.
 *  5. The category dropdown filters the table to only that category.
 *  6. Clicking a column header sorts the table in the expected direction.
 */

test.describe('Expenses — happy path', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
  });

  // ── 1. Navigation ──────────────────────────────────────────────────────────

  test('navigating to Expenses shows the Expenses heading and a populated table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    // Heading and at least one seeded row must be visible
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
    await expect(expenses.tableRows.first()).toBeVisible();
  });

  // ── 2. Add a new transaction ───────────────────────────────────────────────

  test('adding a new expense appends it to the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    const description = 'Playwright test coffee';
    await expenses.addExpense(description, 12.5, 'Food', '2026-03-15');

    // The new row must appear; search is the most reliable way to isolate it
    await expenses.search(description);
    await expect(expenses.tableRows).toHaveCount(1);
    await expect(page.getByText(description)).toBeVisible();
    await expect(page.getByText('-$12.50')).toBeVisible();
  });

  test('newly added expense is reflected in the footer transaction count', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    // Count before adding
    const countBefore = await expenses.tableRows.count();

    await expenses.addExpense('Footer count test', 99, 'Shopping');

    // Count must increase by exactly 1
    await expect(expenses.tableRows).toHaveCount(countBefore + 1);
  });

  // ── 3. Search ──────────────────────────────────────────────────────────────

  test('searching by description term filters the table to matching rows only', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    // "Rent" is one of the seeded Housing descriptions
    await expenses.search('Rent');

    const rows = expenses.tableRows;
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Every visible row must contain "Rent" in its description cell
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText(/rent/i);
    }
  });

  test('clearing the search term restores the full transaction list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    const totalRows = await expenses.tableRows.count();

    await expenses.search('Gym');
    const filteredRows = await expenses.tableRows.count();
    expect(filteredRows).toBeLessThan(totalRows);

    // Clear search
    await expenses.search('');
    await expect(expenses.tableRows).toHaveCount(totalRows);
  });

  // ── 4. Category filter ────────────────────────────────────────────────────

  test('filtering by "Transport" shows only Transport category rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    await expenses.filterByCategory('Transport');

    const rows = expenses.tableRows;
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Each row must display the Transport category badge
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText('Transport');
    }
  });

  test('switching back to "All Categories" restores all rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    const total = await expenses.tableRows.count();

    await expenses.filterByCategory('Health');
    const healthCount = await expenses.tableRows.count();
    expect(healthCount).toBeLessThanOrEqual(total);

    await expenses.filterByCategory('All');
    await expect(expenses.tableRows).toHaveCount(total);
  });

  // ── 5. Sorting ────────────────────────────────────────────────────────────

  test('clicking the Amount column header sorts rows from highest to lowest', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    await expenses.amountHeader.click();

    // After one click (desc by default) the first row's amount cell should be
    // larger than the last row's amount cell.
    const amountCells = page.locator('table tbody tr td:last-child');
    const count = await amountCells.count();

    if (count >= 2) {
      const firstText = await amountCells.first().textContent();
      const lastText = await amountCells.last().textContent();

      const parse = (t: string | null) =>
        parseFloat((t ?? '0').replace(/[^0-9.]/g, ''));

      expect(parse(firstText)).toBeGreaterThanOrEqual(parse(lastText));
    }
  });

});
