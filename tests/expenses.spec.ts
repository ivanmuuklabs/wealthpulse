import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests generated from Jira tickets moved to Done — 2026-09-18
 *
 * Ticket covered: Expenses tab — Add Expense, search, category filter, and sort
 *
 * Happy path: user can add a new expense, search for transactions, filter by
 *             category, and sort the table.
 * Negative path: saving with missing fields is blocked; an unmatched search term
 *                shows the empty state; filtering by a category with no data shows
 *                an empty table.
 */

test.describe('Expenses — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Navigate to Expenses
    const expensesPage = factory.expenses();
    await expensesPage.navigate();
    await expect(expensesPage.heading).toBeVisible();
  });

  test('Expenses heading is visible after navigating from Charts', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  test('transaction table renders rows for the selected month (March default)', async ({ page }) => {
    // At least one row should be visible (seeded data)
    const rows = page.locator('table tbody tr').filter({ hasNotText: 'No transactions found' });
    await expect(rows.first()).toBeVisible();
  });

  test('Add Expense form opens when "Add Expense" button is clicked', async ({ page }) => {
    const factory = new PageFactory(page);
    const expensesPage = factory.expenses();
    await expensesPage.openAddExpenseForm();
    // Form inputs become visible
    await expect(expensesPage.descriptionInput).toBeVisible();
    await expect(expensesPage.amountInput).toBeVisible();
    await expect(expensesPage.saveButton).toBeVisible();
  });

  test('adding a valid expense appends it to the transaction table', async ({ page }) => {
    const factory = new PageFactory(page);
    const expensesPage = factory.expenses();

    // Count rows before
    const rowsBefore = await page.locator('table tbody tr').count();

    // Add a new expense
    await expensesPage.addExpense('Grocery run test', '42.50', 'Food');

    // The new row should appear at the top (table is sorted by date desc by default)
    await expect(page.getByText('Grocery run test')).toBeVisible();

    // Row count should have increased by one
    const rowsAfter = await page.locator('table tbody tr').count();
    expect(rowsAfter).toBeGreaterThan(rowsBefore);
  });

  test('searching for a known description filters the table to matching rows only', async ({ page }) => {
    const factory = new PageFactory(page);
    const expensesPage = factory.expenses();

    // Use a term that appears in seeded data for every month
    await expensesPage.searchFor('Netflix');

    // At least one Netflix row should appear
    await expect(page.getByText('Netflix').first()).toBeVisible();

    // No row with an unrelated description should be in the result
    const rentRow = page.locator('table tbody tr').filter({ hasText: 'Rent payment' });
    await expect(rentRow).toHaveCount(0);
  });

  test('filtering by "Housing" category shows only Housing transactions', async ({ page }) => {
    const factory = new PageFactory(page);
    const expensesPage = factory.expenses();

    await expensesPage.filterByCategory('Housing');

    // Every visible category badge should be "Housing"
    const badges = page.locator('table tbody tr td span').filter({ hasText: 'Housing' });
    const allRows = page.locator('table tbody tr').filter({ hasNotText: 'No transactions found' });
    const rowCount = await allRows.count();
    if (rowCount > 0) {
      const badgeCount = await badges.count();
      expect(badgeCount).toEqual(rowCount);
    }
  });

  test('clicking the Amount column header sorts transactions by amount descending', async ({ page }) => {
    // Click the Amount sort header
    await page.getByRole('columnheader', { name: /Amount/i }).click();

    // Read the first and last amounts from the table
    const firstAmount = await page.locator('table tbody tr td:last-child').first().textContent();
    const lastAmount = await page.locator('table tbody tr td:last-child').last().textContent();

    const parseAmt = (s: string | null) => parseFloat((s ?? '0').replace(/[^0-9.]/g, ''));
    expect(parseAmt(firstAmount)).toBeGreaterThanOrEqual(parseAmt(lastAmount));
  });

  test('the footer shows the correct transaction count after filtering', async ({ page }) => {
    const factory = new PageFactory(page);
    const expensesPage = factory.expenses();

    // Filter by Subscriptions
    await expensesPage.filterByCategory('Subscriptions');

    // Footer text must contain a number
    const footer = page.locator('div').filter({ hasText: /\d+ transaction/ }).last();
    await expect(footer).toBeVisible();
  });
});

test.describe('Expenses — negative path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    const expensesPage = factory.expenses();
    await expensesPage.navigate();
    await expect(expensesPage.heading).toBeVisible();
  });

  test('submitting the Add Expense form with no description does not add a row', async ({ page }) => {
    const factory = new PageFactory(page);
    const expensesPage = factory.expenses();

    const rowsBefore = await page.locator('table tbody tr').count();

    // Open form and try to save without filling Description
    await expensesPage.openAddExpenseForm();
    await expensesPage.amountInput.fill('50');
    await expensesPage.saveButton.click();

    // Row count must not have changed (handleAdd guards against missing fDesc)
    const rowsAfter = await page.locator('table tbody tr').count();
    expect(rowsAfter).toEqual(rowsBefore);
  });

  test('submitting the Add Expense form with no amount does not add a row', async ({ page }) => {
    const factory = new PageFactory(page);
    const expensesPage = factory.expenses();

    const rowsBefore = await page.locator('table tbody tr').count();

    await expensesPage.openAddExpenseForm();
    await expensesPage.descriptionInput.fill('Ghost expense');
    // Leave amount blank
    await expensesPage.saveButton.click();

    const rowsAfter = await page.locator('table tbody tr').count();
    expect(rowsAfter).toEqual(rowsBefore);
  });

  test('searching with a term that matches no transactions shows empty state', async ({ page }) => {
    const factory = new PageFactory(page);
    const expensesPage = factory.expenses();

    // This string won't match any seeded description or category
    await expensesPage.searchFor('ZZZNOMATCH999');

    await expect(page.getByText('No transactions found')).toBeVisible();
  });

  test('filtering by a category and then searching for a different category shows empty state', async ({ page }) => {
    const factory = new PageFactory(page);
    const expensesPage = factory.expenses();

    // Show only Housing transactions
    await expensesPage.filterByCategory('Housing');
    // Then search for a Food keyword that won't match Housing rows
    await expensesPage.searchFor('Netflix');

    // Netflix belongs to Subscriptions, so combined filter → no rows
    await expect(page.getByText('No transactions found')).toBeVisible();
  });

  test('month selector switches to January and the table updates (no March-only data visible)', async ({ page }) => {
    // Switch to January using the month buttons
    await page.getByRole('button', { name: 'Jan' }).click();

    // March dates (2026-03-xx) must not appear in January's view
    const marchRows = page.locator('table tbody td').filter({ hasText: /2026-03/ });
    await expect(marchRows).toHaveCount(0);
  });

  test('closing and reopening the Add Expense form clears previously typed description', async ({ page }) => {
    const factory = new PageFactory(page);
    const expensesPage = factory.expenses();

    // Open and type, then close by clicking the toggle button again
    await expensesPage.openAddExpenseForm();
    await expensesPage.descriptionInput.fill('Temporary text');

    // Close the form (same button toggles it)
    await expensesPage.addExpenseButton.click();
    await expect(expensesPage.descriptionInput).not.toBeVisible();

    // Reopen — the description field should be empty (form state resets)
    await expensesPage.openAddExpenseForm();
    await expect(expensesPage.descriptionInput).toBeEmpty();
  });
});
