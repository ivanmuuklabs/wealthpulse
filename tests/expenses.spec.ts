import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses module tests.
 *
 * Coverage gaps addressed:
 *   Test 2 — adding a new expense via the Add Expense form and confirming it
 *             appears in the transaction table.
 *   Test 3 — real-time search filtering narrows the transaction table to rows
 *             that match the query string.
 *
 * Neither flow had any existing test coverage.
 */

test.describe('Expenses', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to Expenses
    const expensesPage = factory.expenses();
    await expensesPage.navigate();
    // Wait for the table to be present before each test
    await expect(page.locator('table')).toBeVisible();
  });

  // Test 2 — adding a new expense records it in the transaction table
  test('adding a new expense saves it and shows it in the transactions table', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // Capture the initial row count
    const initialCount = await expensesPage.tableRows.count();

    // Open the add-expense form
    await expensesPage.openAddExpenseForm();
    await expect(expensesPage.descriptionInput).toBeVisible();

    // Fill in the form and save
    const uniqueDescription = 'Playwright Coverage Test Expense';
    await expensesPage.addExpense(uniqueDescription, 42.50, 'Food');

    // The form should collapse after saving
    await expect(expensesPage.descriptionInput).not.toBeVisible();

    // The new row should appear in the table
    await expect(page.getByText(uniqueDescription)).toBeVisible();

    // Row count must have increased by exactly one
    await expect(expensesPage.tableRows).toHaveCount(initialCount + 1);
  });

  // Test 3 — search input filters the transaction list in real time
  test('searching by description filters the transaction table to matching rows only', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // Get the first row's description to use as our search term
    const firstRowText = await page.locator('tbody tr td:nth-child(2)').first().textContent();
    expect(firstRowText).not.toBeNull();

    const searchTerm = (firstRowText as string).trim().split(' ')[0]; // first word

    // Type the search term
    await expensesPage.search(searchTerm);

    // Every visible row must contain the search term (case-insensitive check via assertion)
    const visibleRows = expensesPage.tableRows;
    const count = await visibleRows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const rowText = await visibleRows.nth(i).textContent();
      expect((rowText ?? '').toLowerCase()).toContain(searchTerm.toLowerCase());
    }

    // Searching for something that matches nothing should result in zero rows
    await expensesPage.search('xxxxxxxxnotanexpense');
    await expect(expensesPage.tableRows).toHaveCount(0);
  });
});
