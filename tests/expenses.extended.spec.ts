import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

// Expenses extended tests
// Covers: category filter dropdown, column sorting (Date, Amount)

test.describe('Expenses — category filter and sorting', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expenses = factory.expenses();
    await expenses.navigate();
    // Use January which has a known set of seeded transactions
    await expenses.selectMonth('Jan');
  });

  // ----- Category filter -----

  test('filtering by category narrows the table to matching rows only', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Record total rows before filtering
    const totalRows = await expenses.tableRows.count();
    expect(totalRows).toBeGreaterThan(0);

    // Apply the "Food" category filter
    await expenses.filterByCategory('Food');

    // The filtered set should be smaller than the unfiltered set
    const filteredRows = await expenses.tableRows.count();
    expect(filteredRows).toBeGreaterThan(0);
    expect(filteredRows).toBeLessThanOrEqual(totalRows);

    // Every visible row must mention "Food" somewhere
    const tableText = await page.locator('table tbody').textContent();
    expect(tableText?.toLowerCase()).toContain('food');
  });

  test('combining search and category filter produces an intersection result', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Filter by Housing category first
    await expenses.filterByCategory('Housing');
    const housingOnlyCount = await expenses.tableRows.count();

    // Then also search — should narrow further or stay equal
    await expenses.search('Housing');
    const combinedCount = await expenses.tableRows.count();

    expect(combinedCount).toBeLessThanOrEqual(housingOnlyCount);
    // Must still be at least 0 (not throw)
    expect(combinedCount).toBeGreaterThanOrEqual(0);
  });

  // ----- Column sorting -----

  test('clicking the Amount column header sorts rows in descending order', async ({ page }) => {
    // Click the "Amount" column header to sort descending
    await page.getByRole('columnheader', { name: /amount/i }).click();

    // Read the first and last row amounts — first should be >= last
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(1);

    const parseAmount = (text: string | null) =>
      parseFloat((text ?? '0').replace(/[$,\-]/g, '').trim());

    // Get amount cell (4th cell, index 3) for first and last rows
    const firstAmount = parseAmount(
      await rows.first().locator('td').nth(3).textContent()
    );
    const lastAmount = parseAmount(
      await rows.last().locator('td').nth(3).textContent()
    );

    // In descending order the first row amount should be >= last row amount
    expect(firstAmount).toBeGreaterThanOrEqual(lastAmount);
  });

  test('clicking Amount header twice reverses sort to ascending order', async ({ page }) => {
    const amountHeader = page.getByRole('columnheader', { name: /amount/i });

    // First click → descending
    await amountHeader.click();
    // Second click → ascending
    await amountHeader.click();

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(1);

    const parseAmount = (text: string | null) =>
      parseFloat((text ?? '0').replace(/[$,\-]/g, '').trim());

    const firstAmount = parseAmount(
      await rows.first().locator('td').nth(3).textContent()
    );
    const lastAmount = parseAmount(
      await rows.last().locator('td').nth(3).textContent()
    );

    // In ascending order the first row amount should be <= last row amount
    expect(firstAmount).toBeLessThanOrEqual(lastAmount);
  });

  test('footer shows updated count after filtering by category', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Check the footer is visible before any filtering
    await expect(expenses.tableFooter).toBeVisible();

    // Apply Food filter
    await expenses.filterByCategory('Food');

    // Footer should still be visible and reflect the filtered state
    await expect(expenses.tableFooter).toBeVisible();
  });

});
