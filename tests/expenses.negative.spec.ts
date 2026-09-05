import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses Tab — Negative / Edge-Case Tests
 *
 * These tests verify that the Expenses section handles invalid inputs,
 * empty states, and boundary conditions gracefully.
 */

test.describe('Expenses — negative and edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
  });

  // Negative 1 — Submitting the form with no description does not add a row
  test('Add Expense form with empty description does not add a transaction', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const countBefore = await expenses.tableRows.count();

    await expenses.openAddForm();

    // Fill amount but leave description blank
    await expenses.formAmountInput.fill('25.00');
    await expenses.formSaveButton.click();

    // Row count must stay the same — app requires description to save
    await expect(expenses.tableRows).toHaveCount(countBefore);
  });

  // Negative 2 — Submitting with no amount does not add a row
  test('Add Expense form with empty amount does not add a transaction', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const countBefore = await expenses.tableRows.count();

    await expenses.openAddForm();

    // Fill description but leave amount blank
    await expenses.formDescriptionInput.fill('Gym membership');
    await expenses.formSaveButton.click();

    await expect(expenses.tableRows).toHaveCount(countBefore);
  });

  // Negative 3 — Searching for a non-existent term shows "No transactions found"
  test('searching for a term that matches nothing shows the empty-state message', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.searchFor('xyzzy_no_match_9999');

    await expect(expenses.noResultsRow).toBeVisible();
    await expect(expenses.tableRows).toHaveCount(0);
  });

  // Negative 4 — Filtering by a category that has no spending shows no rows
  test('filtering by a category with no transactions in the selected month shows empty state', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Housing has exactly 1 transaction per month (seeded); this tests that only
    // that category's transactions are shown, not that there are zero.
    // To force an empty result, combine a restrictive category filter with a
    // term that doesn't match Housing transactions.
    await expenses.filterByCategory('Housing');
    await expenses.searchFor('xyzzy_no_match_9999');

    await expect(expenses.noResultsRow).toBeVisible();
  });

  // Negative 5 — Searching while a category filter is active narrows results further
  test('combined category filter + search narrows rows to the intersection', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Filter to Food, then search for something definitely not Food
    await expenses.filterByCategory('Food');
    await expenses.searchFor('Electric bill');

    // "Electric bill" is in Utilities, not Food — should yield nothing
    await expect(expenses.noResultsRow).toBeVisible();
  });

  // Negative 6 — Negative amount is accepted by the number input but results in a
  //              row with a negative value (edge case validation)
  test('adding an expense with a negative amount still creates a row (edge case)', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const countBefore = await expenses.tableRows.count();

    await expenses.openAddForm();
    await expenses.addExpense('Refund', '-10.00', 'Shopping');

    // The app does not block negative amounts; verify the row is added
    await expect(expenses.tableRows).toHaveCount(countBefore + 1);
    await expect(page.getByText('Refund')).toBeVisible();
  });

  // Negative 7 — Clicking Amount sort twice reverses to ascending order
  test('clicking the Amount column header twice sorts ascending (smallest first)', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const amountHeader = page.getByRole('columnheader', { name: /amount/i });

    // First click → descending
    await amountHeader.click();
    // Second click → ascending
    await amountHeader.click();

    const rows = expenses.tableRows;
    const count = await rows.count();
    expect(count).toBeGreaterThan(1);

    const parseAmount = (text: string | null) =>
      parseFloat((text ?? '0').replace(/[^0-9.]/g, ''));

    const first = parseAmount(await rows.nth(0).locator('td').nth(3).textContent());
    const second = parseAmount(await rows.nth(1).locator('td').nth(3).textContent());

    // Ascending: first ≤ second
    expect(first).toBeLessThanOrEqual(second);
  });

  // Negative 8 — Toggling the Add Expense form closed without saving keeps row count intact
  test('opening then closing the Add Expense form without saving leaves row count unchanged', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const countBefore = await expenses.tableRows.count();

    // Open the form
    await expenses.openAddForm();
    await expect(expenses.formDescriptionInput).toBeVisible();

    // Close by clicking the button again (it acts as a toggle)
    await expenses.addExpenseButton.click();
    await expect(expenses.formDescriptionInput).not.toBeVisible();

    // Count unchanged
    await expect(expenses.tableRows).toHaveCount(countBefore);
  });
});
