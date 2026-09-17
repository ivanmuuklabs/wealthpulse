import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Functional tests for the Expenses tab.
 *
 * Covers three previously untested flows:
 *   1. Adding a new expense via the form
 *   2. Filtering transactions by category dropdown
 *   3. Searching transactions by description keyword
 */

test.describe('Expenses tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to Expenses
    const expenses = factory.expenses();
    await expenses.navigate();
  });

  // Test 3 — Adding a new expense via the form appends it to the table
  test('adding a new expense shows it in the transactions table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.openAddForm();

    // Fill in the form with a recognisable description
    await expenses.descriptionInput.fill('Test Coffee Shop');
    await expenses.amountInput.fill('12.50');
    // Leave category as the default (Food) and save
    await expenses.saveButton.click();

    // The new row must appear in the table
    await expect(page.getByRole('cell', { name: 'Test Coffee Shop' })).toBeVisible();

    // The form should close after saving (description field gone)
    await expect(expenses.descriptionInput).not.toBeVisible();
  });

  // Test 4 — Category filter shows only transactions of the selected category
  test('filtering by Transport shows only Transport transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Select the Transport category in the filter dropdown
    await expenses.filterByCategory('Transport');

    // Every visible row must have a Transport badge
    const rows = page.locator('tbody tr').filter({ hasNot: page.locator('td[colspan]') });
    const rowCount = await rows.count();

    // There must be at least one Transport transaction in the seeded data
    expect(rowCount).toBeGreaterThan(0);

    // Spot-check: every row must contain the word "Transport" (category badge)
    for (let i = 0; i < rowCount; i++) {
      await expect(rows.nth(i)).toContainText('Transport');
    }
  });

  // Test 5 — Search by keyword narrows the transaction list
  test('searching for "Netflix" shows only Netflix transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // "Subscriptions" seed data includes a Netflix entry
    await expenses.search('Netflix');

    // At least one row must match
    const rows = page.locator('tbody tr').filter({ hasNot: page.locator('td[colspan]') });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Every visible row must contain "Netflix" in the description cell
    for (let i = 0; i < rowCount; i++) {
      await expect(rows.nth(i)).toContainText('Netflix');
    }

    // Clear the search — rows should return
    await expenses.search('');
    await expect(rows.first()).toBeVisible();
  });
});
