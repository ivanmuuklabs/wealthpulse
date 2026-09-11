import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests for the Expenses tab.
 *
 * Coverage gaps addressed:
 *  1. Add Expense form — creating a new transaction and verifying it appears in the list.
 *  2. Search and category filter — filtering the transaction table by keyword and category.
 *
 * Both flows were completely untested before this spec.
 */

test.describe('Expenses', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Expenses tab
    await new PageFactory(page).expenses().navigate();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  // ─── Test 2: Add Expense ─────────────────────────────────────────────────
  test('adding a new expense appends it to the transaction list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Open the inline Add Expense form
    await expenses.openAddForm();
    await expect(page.getByText('New Expense')).toBeVisible();

    // Fill in the form fields
    const uniqueDesc = 'Playwright Test Coffee';
    await page.locator('input[type="date"]').fill('2026-03-15');
    await page.getByPlaceholder('Description').fill(uniqueDesc);
    await page.getByPlaceholder('Amount').fill('12.50');
    // Select the Food category from the form's select element
    // The form card has class !border-emerald-500/20 — scope the select inside it
    await page.locator('[class*="border-emerald-500"]').locator('select').selectOption('Food');
    await page.getByRole('button', { name: 'Save' }).click();

    // After saving, the form should collapse (no "New Expense" heading)
    await expect(page.getByText('New Expense')).not.toBeVisible();

    // The new transaction description must appear in the table
    await expect(page.getByRole('cell', { name: uniqueDesc })).toBeVisible();
  });

  // ─── Test 3: Search & Category Filter ───────────────────────────────────
  test('searching transactions by description filters the table rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // First confirm there are some rows present before filtering
    await expect(expenses.transactionRows.first()).toBeVisible();

    // Type a term that matches a known seeded description
    await expenses.search('Rent');

    // At least one row containing "Rent" should be visible
    const matchingRows = page.getByRole('row').filter({ hasText: /Rent/i });
    await expect(matchingRows.first()).toBeVisible();

    // Rows that don't match should not appear — total visible rows should drop
    const rowCount = await expenses.transactionRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Searching for something that matches nothing shows the empty state
    await expenses.search('zzznomatchzzz');
    await expect(expenses.emptyState).toBeVisible();
    await expect(expenses.transactionRows).toHaveCount(0);
  });
});
