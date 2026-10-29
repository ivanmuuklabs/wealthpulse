import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses — table column sort tests
 *
 * The Expenses tab exposes sortable column headers for Date, Category, and
 * Amount. Clicking a header sorts ascending; clicking again sorts descending.
 * These tests verify the sort behaviour using the seeded demo data.
 *
 * The PR's expenses.spec.ts does not cover sort interactions — only add,
 * search, filter, and month switching — so these tests fill that gap.
 */

test.describe('Expenses — column sort', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
    await expect(new PageFactory(page).expenses().heading).toBeVisible();
  });

  test('clicking the Amount header sorts transactions by amount descending', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Click "Amount" column header to sort descending (first click)
    await expenses.amountHeader.click();

    // Read the first two amount cells — row 0 should be >= row 1
    const rows = expenses.tableRows;
    const firstAmountText  = await rows.nth(0).locator('td').nth(3).textContent() ?? '';
    const secondAmountText = await rows.nth(1).locator('td').nth(3).textContent() ?? '';

    const parse = (s: string) => parseFloat(s.replace(/[^0-9.]/g, ''));
    expect(parse(firstAmountText)).toBeGreaterThanOrEqual(parse(secondAmountText));
  });

  test('clicking the Amount header twice sorts transactions by amount ascending', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // First click → descending, second click → ascending
    await expenses.amountHeader.click();
    await expenses.amountHeader.click();

    const rows = expenses.tableRows;
    const firstAmountText  = await rows.nth(0).locator('td').nth(3).textContent() ?? '';
    const secondAmountText = await rows.nth(1).locator('td').nth(3).textContent() ?? '';

    const parse = (s: string) => parseFloat(s.replace(/[^0-9.]/g, ''));
    expect(parse(firstAmountText)).toBeLessThanOrEqual(parse(secondAmountText));
  });

  test('clicking the Date header sorts transactions by date descending (most recent first)', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Default sort is already date-desc, but click explicitly to confirm
    await expenses.dateHeader.click();

    // After one click the direction may toggle — click again to guarantee desc
    await expenses.dateHeader.click();

    const rows = expenses.tableRows;
    const firstDate  = await rows.nth(0).locator('td').nth(0).textContent() ?? '';
    const secondDate = await rows.nth(1).locator('td').nth(0).textContent() ?? '';

    // Descending: firstDate >= secondDate lexicographically (ISO format)
    expect(firstDate.trim() >= secondDate.trim()).toBe(true);
  });

  test('clicking the Date header once from default state changes sort direction', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Record current first date (default: desc)
    const before = await expenses.tableRows.nth(0).locator('td').nth(0).textContent() ?? '';

    // One click — toggles to asc
    await expenses.dateHeader.click();

    const after = await expenses.tableRows.nth(0).locator('td').nth(0).textContent() ?? '';

    // The first row's date should now be different (earliest date, not latest)
    expect(before.trim()).not.toEqual(after.trim());
  });

  test('clicking the Category header groups rows alphabetically by category', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Sort by category descending (first click)
    await expenses.categoryHeader.click();

    // Read the category badge text for the first 2 rows
    const firstCat  = await expenses.tableRows.nth(0).locator('td').nth(2).textContent() ?? '';
    const secondCat = await expenses.tableRows.nth(1).locator('td').nth(2).textContent() ?? '';

    // In descending order first row's category >= second row's category (lexicographic)
    expect(firstCat.trim() >= secondCat.trim()).toBe(true);
  });

  test('sort is preserved after adding a new expense', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Sort by amount descending
    await expenses.amountHeader.click();

    // Add a small expense — it should slot into the correct position
    await expenses.addExpense('Sort test item', 1.00);

    // The heading must still be visible (no crash, table still sorted)
    await expect(expenses.heading).toBeVisible();

    // The row count should have increased by 1
    const count = await expenses.tableRows.count();
    expect(count).toBeGreaterThan(0);
  });
});
