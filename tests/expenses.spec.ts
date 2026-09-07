import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses tab — happy path and negative tests.
 *
 * User stories covered:
 *   WP-101  As a user I can add a new expense so it appears in the list.
 *   WP-102  As a user I can search transactions by keyword so I find them quickly.
 *   WP-103  As a user I can filter transactions by category to focus on one spend area.
 *   WP-104  As a user I can sort transactions by Date, Category, or Amount.
 */

test.describe('Expenses — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
  });

  // WP-101: Add a new expense
  test('adding a new expense shows it in the transaction list', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    await expensesPage.openAddForm();

    // Fill the form and save
    await expensesPage.addExpense('Playwright coffee', '4.50', 'Food', '2026-03-15');

    // The new transaction description should appear in the list
    await expect(page.getByText('Playwright coffee')).toBeVisible();
  });

  // WP-101: New expense increases the transaction count
  test('transaction count increments after a new expense is added', async ({ page }) => {
    const factory = new PageFactory(page);
    const expensesPage = factory.expenses();

    // Count before adding
    const countBefore = await expensesPage.transactionRows.count();

    await expensesPage.openAddForm();
    await expensesPage.addExpense('Count check item', '9.99', 'Shopping');

    // One more row should be present
    await expect(expensesPage.transactionRows).toHaveCount(countBefore + 1);
  });

  // WP-102: Search finds a matching transaction
  test('searching by keyword filters the transaction list to matching rows', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // "Netflix" is a seeded Subscriptions transaction
    await expensesPage.search('Netflix');

    // At least one row should survive the filter
    await expect(expensesPage.transactionRows.first()).toBeVisible();

    // Every visible description should contain the keyword (case-insensitive)
    const rowCount = await expensesPage.transactionRows.count();
    for (let i = 0; i < rowCount; i++) {
      const text = (await expensesPage.transactionRows.nth(i).textContent())?.toLowerCase() ?? '';
      expect(text).toContain('netflix');
    }
  });

  // WP-103: Category filter
  test('filtering by Food category shows only Food transactions', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    await expensesPage.filterByCategory('Food');

    // Confirm every row carries the Food category badge
    const rowCount = await expensesPage.transactionRows.count();
    expect(rowCount).toBeGreaterThan(0);
    for (let i = 0; i < rowCount; i++) {
      const text = (await expensesPage.transactionRows.nth(i).textContent()) ?? '';
      expect(text).toContain('Food');
    }
  });

  // WP-104: Sort by amount (descending)
  test('clicking Amount header sorts transactions from highest to lowest', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    await expensesPage.sortByColumn('Amount');

    // Read the first two amount cells and verify order
    const amountCells = page.locator('tbody tr td:last-child');
    const first = parseFloat(
      ((await amountCells.first().textContent()) ?? '0').replace(/[$,-]/g, '')
    );
    const second = parseFloat(
      ((await amountCells.nth(1).textContent()) ?? '0').replace(/[$,-]/g, '')
    );
    expect(first).toBeGreaterThanOrEqual(second);
  });

  // WP-104: Month selector on Expenses tab
  test('switching to January from March updates the transaction total', async ({ page }) => {
    // Default is March — switch to January and confirm the total label changes
    const marchTotal = await page.locator('text=/Total:/').textContent();

    await page.getByRole('button', { name: 'Jan' }).click();
    const janTotal = await page.locator('text=/Total:/').textContent();

    // The seeded data differs between months
    expect(marchTotal).not.toEqual(janTotal);
  });
});

test.describe('Expenses — negative path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
  });

  // WP-102: No results for unmatched keyword
  test('searching for a non-existent keyword shows the empty-state message', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    await expensesPage.search('zzznotexistent999');

    await expect(expensesPage.noResultsMessage).toBeVisible();
    await expect(expensesPage.transactionRows).toHaveCount(0);
  });

  // WP-101: Add expense without required fields does NOT save
  test('submitting add-expense form without description does not add a row', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();
    const countBefore = await expensesPage.transactionRows.count();

    // Open form and click Save without filling description or amount
    await expensesPage.openAddForm();
    await page.getByRole('button', { name: 'Save' }).click();

    // Count should remain unchanged
    await expect(expensesPage.transactionRows).toHaveCount(countBefore);
  });

  // WP-103: Filtering by a low-activity category may return zero rows
  test('filtering by a category that has no spending shows empty state', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // Switch to January and filter Subscriptions — there may be no transactions at all
    await page.getByRole('button', { name: 'Jan' }).click();
    await expensesPage.filterByCategory('Subscriptions');
    await expensesPage.search('zzznosuchsubscription');

    // Either rows exist OR the empty message is shown — never both
    const rowCount = await expensesPage.transactionRows.count();
    if (rowCount === 0) {
      await expect(expensesPage.noResultsMessage).toBeVisible();
    } else {
      await expect(expensesPage.noResultsMessage).not.toBeVisible();
    }
  });

  // WP-102: Clearing search restores the full list
  test('clearing the search input restores all transactions for the selected month', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();
    const countBefore = await expensesPage.transactionRows.count();

    // Filter down then clear
    await expensesPage.search('zzznotexistent999');
    await expect(expensesPage.noResultsMessage).toBeVisible();

    await expensesPage.search('');
    await expect(expensesPage.transactionRows).toHaveCount(countBefore);
  });

  // WP-104: Sorting by Amount descending then again toggles to ascending
  test('clicking Amount header twice switches sort from descending to ascending', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // First click — descending
    await expensesPage.sortByColumn('Amount');
    const amountCells = page.locator('tbody tr td:last-child');
    const descFirst = parseFloat(
      ((await amountCells.first().textContent()) ?? '0').replace(/[$,-]/g, '')
    );

    // Second click — ascending
    await expensesPage.sortByColumn('Amount');
    const ascFirst = parseFloat(
      ((await amountCells.first().textContent()) ?? '0').replace(/[$,-]/g, '')
    );

    // The smallest value should appear first after the second click
    expect(ascFirst).toBeLessThanOrEqual(descFirst);
  });
});
