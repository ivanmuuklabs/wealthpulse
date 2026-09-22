import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses tab — core flows
 *
 * Covers three previously untested critical flows:
 *   1. Adding a new expense via the inline form
 *   2. Filtering the transaction list by category
 *   3. Searching transactions by description keyword
 */

test.describe('Expenses — core flows', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Expenses tab before each test
    await new PageFactory(page).expenses().navigate();
  });

  // Test 2 — adding a new expense appears in the transaction table
  test('adding a new expense via the form appends it to the transaction list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Record how many rows exist before adding
    const countBefore = await expenses.transactionRows.count();

    // Open the Add Expense form
    await expenses.openAddForm();

    // Fill in the form — use a distinctive description so we can find it later
    await expenses.formDescription.fill('E2E Test Coffee');
    await expenses.formAmount.fill('9.99');
    // Leave category as default (Food) — select it explicitly for clarity
    await page.locator('.grid').filter({ hasText: 'New Expense' }).getByRole('combobox').selectOption('Food');
    await expenses.formSaveButton.click();

    // The new row should appear and the total row count should increase by 1
    await expect(page.getByText('E2E Test Coffee')).toBeVisible();
    const countAfter = await expenses.transactionRows.count();
    expect(countAfter).toBe(countBefore + 1);
  });

  // Test 3 — filtering by category narrows the table to matching rows only
  test('filtering by category shows only transactions for that category', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Filter to Housing — which has exactly 1 transaction per month (seeded)
    await expenses.filterByCategory('Housing');

    // Every visible row must show the Housing category badge
    const rows = expenses.transactionRows;
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    for (let i = 0; i < rowCount; i++) {
      await expect(rows.nth(i).getByText('Housing')).toBeVisible();
    }

    // Footer count should match the visible rows
    await expect(expenses.footerCount).toContainText(`${rowCount} transaction`);
  });

  // Test 4 — searching by keyword filters the transaction list
  test('searching for a keyword shows only matching transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // "Netflix" is a seeded Subscriptions expense — reliably present in the data
    await expenses.search('Netflix');

    // At least one result should be visible
    await expect(page.getByText('Netflix')).toBeVisible();

    // No row should mention Housing (unrelated category)
    const housingInResults = page.locator('tbody tr').filter({ hasText: 'Housing' });
    await expect(housingInResults).toHaveCount(0);

    // Searching for something non-existent shows the empty state
    await expenses.search('xxxxxxnotransaction');
    await expect(expenses.noResultsRow).toBeVisible();
  });
});
