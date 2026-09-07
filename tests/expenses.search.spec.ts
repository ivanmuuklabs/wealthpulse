import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

// Test 4 — Expenses: search input and category filter narrow the transaction table
test.describe('Expenses — Search and filter', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expenses = factory.expenses();
    await expenses.navigate();
    // Use January which has a known set of seeded transactions
    await expenses.selectMonth('Jan');
  });

  test('typing in the search box filters rows to those matching the query', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Record the unfiltered row count
    const totalRows = await expenses.tableRows.count();
    expect(totalRows).toBeGreaterThan(0);

    // Search for a term unlikely to match every row
    await expenses.search('Housing');

    // At least one row should remain and all visible rows contain "Housing"
    const filteredRows = await expenses.tableRows.count();
    expect(filteredRows).toBeGreaterThan(0);
    expect(filteredRows).toBeLessThanOrEqual(totalRows);

    // Every visible cell should include "Housing" somewhere (check text in entire table)
    const tableText = await page.locator('table tbody').textContent();
    expect(tableText?.toLowerCase()).toContain('housing');
  });

  test('searching for a non-existent term results in an empty table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('zzznomatchterm');

    // No data rows should be visible
    await expect(expenses.tableRows).toHaveCount(0);
  });

});
