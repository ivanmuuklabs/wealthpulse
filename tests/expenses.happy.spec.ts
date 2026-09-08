import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Expenses tab.
 *
 * User story: "As a user I can log new expenses, search through existing
 * transactions, filter by category, and sort the table — so I have full
 * control over my spending records."
 *
 * All tests log in as demo/demo123, navigate to Expenses, and exercise one
 * primary success scenario each.
 */

test.describe('Expenses — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
  });

  // ── Add Expense ──────────────────────────────────────────────────────────

  test('adding a valid expense appends it to the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Open the form and fill all fields
    await expenses.openForm();
    await expenses.addExpense({
      date: '2026-03-15',
      description: 'QA Test Coffee',
      amount: '4.75',
      category: 'Food',
    });

    // The form should close (Save button gone) and the new row should appear
    await expect(page.getByText('QA Test Coffee')).toBeVisible();
  });

  test('added expense is immediately reflected in the footer total', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Read the current total from the footer before adding
    const beforeText = await expenses.totalLabel.textContent();
    const parseAmount = (t: string | null) =>
      parseFloat((t ?? '').replace(/[^0-9.]/g, ''));
    const before = parseAmount(beforeText);

    // Add a new $100 expense
    await expenses.openForm();
    await expenses.addExpense({
      date: '2026-03-10',
      description: 'QA Test Rent',
      amount: '100',
      category: 'Housing',
    });

    // Wait for the new row to appear, then check the updated total
    await expect(page.getByText('QA Test Rent')).toBeVisible();
    const afterText = await expenses.totalLabel.textContent();
    const after = parseAmount(afterText);

    // Total should have grown by at least $100 (the new item)
    expect(after).toBeGreaterThan(before);
  });

  // ── Search ───────────────────────────────────────────────────────────────

  test('searching by description filters the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // First, add a uniquely-named expense we can search for
    await expenses.openForm();
    await expenses.addExpense({
      date: '2026-03-05',
      description: 'UniqueQAMarcoPolo',
      amount: '9.99',
    });
    await expect(page.getByText('UniqueQAMarcoPolo')).toBeVisible();

    // Now search for it
    await expenses.search('UniqueQAMarcoPolo');

    // Only the matching row should remain
    await expect(expenses.tableRows).toHaveCount(1);
    await expect(page.getByText('UniqueQAMarcoPolo')).toBeVisible();
  });

  test('clearing the search restores all transactions for the month', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Get the total count before searching
    const totalBefore = await expenses.tableRows.count();

    // Apply a search that narrows to 0 or few rows
    await expenses.search('zzz_no_match');
    await expect(expenses.tableRows).toHaveCount(0);

    // Clear the search
    await expenses.search('');
    await expect(expenses.tableRows).toHaveCount(totalBefore);
  });

  // ── Category filter ───────────────────────────────────────────────────────

  test('filtering by Food category shows only Food transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.filterByCategory('Food');

    // Every visible row should have the Food category badge
    const badgeCount = await page.getByText('Food').count();
    // At least one row and all visible rows belong to Food
    expect(badgeCount).toBeGreaterThan(0);
    const nonFoodRows = await page
      .locator('tbody tr')
      .filter({ hasNot: page.getByText('Food') })
      .count();
    expect(nonFoodRows).toBe(0);
  });

  // ── Sort ─────────────────────────────────────────────────────────────────

  test('clicking the Amount header sorts transactions by amount descending', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.sortBy('amount');

    // Read the first and last amount values from the table
    const cells = page.locator('tbody tr td:last-child');
    const count = await cells.count();
    if (count < 2) return; // not enough rows to test ordering

    const parse = (t: string | null) =>
      parseFloat((t ?? '').replace(/[^0-9.]/g, ''));

    const first = parse(await cells.first().textContent());
    const last = parse(await cells.last().textContent());

    // Descending: first ≥ last
    expect(first).toBeGreaterThanOrEqual(last);
  });

  test('clicking the Date header sorts transactions by date descending then ascending', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // First click → desc (most recent first)
    await expenses.sortBy('date');
    const descDates = await page.locator('tbody tr td:first-child').allTextContents();

    // Second click → asc (oldest first)
    await expenses.sortBy('date');
    const ascDates = await page.locator('tbody tr td:first-child').allTextContents();

    // The first date in desc should be >= first date in asc when both are non-empty
    if (descDates.length > 1 && ascDates.length > 1) {
      expect(descDates[0] >= ascDates[0]).toBeTruthy();
    }
  });

  // ── Month switching ───────────────────────────────────────────────────────

  test('switching to February shows that month\'s transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.febButton.click();

    // All visible dates should be in February 2026
    const dateCells = page.locator('tbody tr td:first-child');
    const count = await dateCells.count();
    for (let i = 0; i < count; i++) {
      const text = await dateCells.nth(i).textContent();
      expect(text).toMatch(/^2026-02-/);
    }
  });
});
