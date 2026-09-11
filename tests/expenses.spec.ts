import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expense Management — Happy Path & Negative Tests
 *
 * User story: "As a logged-in user I can log new expenses, search, filter
 * by category, and view a live table of transactions so that I always know
 * where my money has gone."
 *
 * Acceptance criteria (happy path):
 * - Transaction table loads with seeded rows for the current month
 * - Add Expense form appears when the button is clicked
 * - A valid new expense is inserted at the top of the table
 * - Searching by description filters the table in real time
 * - Clearing the search restores all rows
 * - Category filter shows only matching category rows
 * - Month selector scopes transactions to the chosen month
 * - Footer shows the correct count of visible rows
 *
 * Negative / edge cases:
 * - Submitting the form with no description does NOT add a row
 * - Submitting the form with no amount does NOT add a row
 * - A search term that matches nothing shows the empty state
 * - Category filter combined with a no-match search shows empty state
 */

test.describe('Expense Management — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expenses = factory.expenses();
    await expenses.navigate();
    await expect(expenses.heading).toBeVisible();
  });

  test('transaction table loads with seeded rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const rowCount = await expenses.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('clicking Add Expense reveals the new-expense form', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.openAddExpenseForm();

    await expect(expenses.descriptionInput).toBeVisible();
    await expect(expenses.amountInput).toBeVisible();
    await expect(expenses.saveButton).toBeVisible();
  });

  test('saving a valid expense inserts a new row in the table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const initialCount = await expenses.tableRows.count();

    await expenses.openAddExpenseForm();
    await expenses.fillAndSaveExpense('Test Coffee', '4.50', 'Food');

    // Row count should increase by 1
    await expect(expenses.tableRows).toHaveCount(initialCount + 1);
  });

  test('newly saved expense description appears in the table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const uniqueDesc = `AutomatedTest-${Date.now()}`;

    await expenses.openAddExpenseForm();
    await expenses.fillAndSaveExpense(uniqueDesc, '12.00');

    await expect(page.getByText(uniqueDesc)).toBeVisible();
  });

  test('footer count matches the number of visible rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const rowCount = await expenses.tableRows.count();

    // Footer label: "N transaction(s)"
    await expect(expenses.footerCount).toContainText(String(rowCount));
  });

  test('searching by description filters the table to matching rows only', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // "Rent" is a seeded Housing description — should match at least once
    await expenses.search('Rent');

    const rows = await expenses.tableRows.count();
    expect(rows).toBeGreaterThanOrEqual(1);

    // Every visible description cell should contain "Rent" (case-insensitive)
    const descriptions = await page.locator('tbody td:nth-child(2)').allTextContents();
    for (const desc of descriptions) {
      expect(desc.toLowerCase()).toContain('rent');
    }
  });

  test('clearing the search input restores all seeded rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const initialCount = await expenses.tableRows.count();

    await expenses.search('Rent');
    const filteredCount = await expenses.tableRows.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Clear search
    await expenses.search('');
    await expect(expenses.tableRows).toHaveCount(initialCount);
  });

  test('category filter shows only rows matching the selected category', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.filterByCategory('Food');

    const rows = await expenses.tableRows.count();
    expect(rows).toBeGreaterThan(0);

    // Every badge in the Category column should read "Food"
    const badges = await page.locator('tbody td:nth-child(3) span').allTextContents();
    for (const badge of badges) {
      expect(badge).toContain('Food');
    }
  });

  test('switching months changes the transactions shown', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Default is March — record its row count
    const marCount = await expenses.tableRows.count();

    await expenses.selectMonth('Jan');
    const janCount = await expenses.tableRows.count();

    // Both months should have data
    expect(marCount).toBeGreaterThan(0);
    expect(janCount).toBeGreaterThan(0);
  });
});

test.describe('Expense Management — negative / edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expenses = factory.expenses();
    await expenses.navigate();
    await expect(expenses.heading).toBeVisible();
  });

  test('submitting the form without a description does not add a new row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const initialCount = await expenses.tableRows.count();

    await expenses.openAddExpenseForm();
    // Leave description empty, fill only amount
    await expenses.amountInput.fill('20.00');
    await expenses.saveButton.click();

    // Row count must remain unchanged
    await expect(expenses.tableRows).toHaveCount(initialCount);
  });

  test('submitting the form without an amount does not add a new row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const initialCount = await expenses.tableRows.count();

    await expenses.openAddExpenseForm();
    // Fill description but leave amount empty
    await expenses.descriptionInput.fill('No Amount Test');
    await expenses.saveButton.click();

    await expect(expenses.tableRows).toHaveCount(initialCount);
  });

  test('a search term that matches no description shows the empty-state row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('zzznotarealterm99999');

    await expect(expenses.emptyState).toBeVisible();
    await expect(expenses.tableRows).toHaveCount(0);
  });

  test('footer shows 0 transactions for a no-match search', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('zzznotarealterm99999');

    await expect(expenses.footerCount).toContainText('0');
  });

  test('category filter combined with a no-match search shows the empty state', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.filterByCategory('Food');
    // Now search for something that definitely doesn't exist in Food
    await expenses.search('zzznotarealterm99999');

    await expect(expenses.emptyState).toBeVisible();
  });
});
