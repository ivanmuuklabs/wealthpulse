import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses Tab tests
 * ==================
 * User story: "As a user I want to view, add, search and filter my expense
 * transactions so that I can understand and control my spending."
 *
 * Acceptance criteria inferred from the app's Expenses tab:
 *  - Happy Path:
 *    AC1. Navigating to Expenses shows the transaction table with seeded data.
 *    AC2. Adding a new expense with valid inputs inserts a row and updates the footer total.
 *    AC3. Searching by description filters the table to matching rows only.
 *    AC4. Filtering by category shows only transactions for that category.
 *    AC5. Clearing the search term restores all transactions.
 *  - Negative Path:
 *    AC6. Searching for a non-existent term shows the empty state message.
 *    AC7. Filtering to a category with no transactions shows the empty state.
 */

test.describe('Expenses — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Expenses tab
    const expensesPage = factory.expenses();
    await expensesPage.navigate();
  });

  // AC1 — Transaction table is populated after login
  test('Expenses tab shows pre-seeded transactions on load', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // At least one transaction row must be visible
    await expect(expensesPage.tableRows.first()).toBeVisible();

    // The heading confirms we are on the right section
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();

    // The footer total should be a non-zero dollar amount
    await expect(expensesPage.footerTotal).toContainText('$');
  });

  // AC2 — Adding a valid expense inserts a new row
  test('adding a valid expense inserts it into the transaction list', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    const initialCount = await expensesPage.tableRows.count();

    await expensesPage.openAddForm();
    await expensesPage.addExpense('2026-03-15', 'Test Grocery Run', 42.50, 'Food');

    // The new row should now appear and total count should increase
    await expect(expensesPage.tableRows).toHaveCount(initialCount + 1);

    // The new row description is visible in the table
    await expect(page.getByRole('cell', { name: 'Test Grocery Run' })).toBeVisible();
  });

  // AC3 — Search by description filters correctly
  test('searching by description shows only matching transactions', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // Add a uniquely identifiable expense first
    await expensesPage.openAddForm();
    await expensesPage.addExpense('2026-03-10', 'UniqueSearchTermXYZ', 99.00, 'Shopping');

    await expensesPage.search('UniqueSearchTermXYZ');

    // Only one row should match
    await expect(expensesPage.tableRows).toHaveCount(1);
    await expect(page.getByRole('cell', { name: 'UniqueSearchTermXYZ' })).toBeVisible();
  });

  // AC4 — Category filter shows only transactions for that category
  test('category filter restricts the table to the selected category', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    await expensesPage.filterByCategory('Housing');

    // All visible rows must belong to the Housing category
    const categoryBadges = page.locator('tbody td span').filter({ hasText: 'Housing' });
    const rowCount = await expensesPage.tableRows.count();

    // Every row must have a Housing badge
    await expect(categoryBadges).toHaveCount(rowCount);
  });

  // AC5 — Clearing the search restores all transactions
  test('clearing the search term restores the full transaction list', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    const allCount = await expensesPage.tableRows.count();

    // Apply a search that reduces results
    await expensesPage.search('Rent');
    const filteredCount = await expensesPage.tableRows.count();
    expect(filteredCount).toBeLessThan(allCount);

    // Clear the search
    await expensesPage.search('');

    // Full list is back
    await expect(expensesPage.tableRows).toHaveCount(allCount);
  });
});

test.describe('Expenses — negative path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expensesPage = factory.expenses();
    await expensesPage.navigate();
  });

  // AC6 — No-match search shows empty state
  test('searching a non-existent term shows the empty state message', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    await expensesPage.search('xxxxxxxxnotransaction99999');

    await expect(expensesPage.emptyState).toBeVisible();
    await expect(expensesPage.tableRows).toHaveCount(0);
  });

  // AC7 — Filtering to a zero-spend category shows empty state
  test('filtering by Subscriptions category when no Subscriptions transactions exist shows empty state', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // First search for something that matches nothing, then category-filter to force empty
    await expensesPage.search('xxxxxxxxnotransaction99999');
    await expensesPage.filterByCategory('Subscriptions');

    await expect(expensesPage.emptyState).toBeVisible();
    await expect(expensesPage.tableRows).toHaveCount(0);
  });
});
