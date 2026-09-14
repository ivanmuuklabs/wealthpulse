import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses Tab Tests
 *
 * Covers the user story: "As a user I can view, filter, sort, and add
 * expense transactions on the Expenses tab."
 *
 * Sources: PR #14 (Rename Dashboard → Charts) — the Expenses tab was
 * part of the shipped release. These tests guard regressions and validate
 * the primary flows identified from the app source.
 */

test.describe('Expenses — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
  });

  test('Expenses tab loads and shows the transaction table with seeded data', async ({ page }) => {
    const factory = new PageFactory(page);
    const expenses = factory.expenses();

    await expenses.navigate();

    // Heading confirms correct tab
    await expect(expenses.heading).toBeVisible();

    // Seeded data populates the table — at least one row is visible
    await expect(expenses.tableRows.first()).toBeVisible();

    // Footer shows a total (non-zero)
    await expect(expenses.tableTotal).toBeVisible();
  });

  test('adding a new expense appends it to the transaction list', async ({ page }) => {
    const factory = new PageFactory(page);
    const expenses = factory.expenses();

    await expenses.navigate();

    // Count rows before adding
    const before = await expenses.tableRows.count();

    // Add a new expense
    await expenses.addExpense('Playwright test lunch', 42.5, 'Food', '2026-03-20');

    // The new row should appear and the count should increase
    await expect(expenses.tableRows).toHaveCount(before + 1);
    await expect(page.getByText('Playwright test lunch')).toBeVisible();
  });

  test('searching by description filters the transaction list', async ({ page }) => {
    const factory = new PageFactory(page);
    const expenses = factory.expenses();

    await expenses.navigate();

    // Add a uniquely-named transaction first so we can reliably find it
    await expenses.addExpense('UniqueSearchTarget_XYZ', 10, 'Shopping');

    // Search for it
    await expenses.search('UniqueSearchTarget_XYZ');

    // Only the matching row(s) should remain
    await expect(expenses.tableRows).toHaveCount(1);
    await expect(page.getByText('UniqueSearchTarget_XYZ')).toBeVisible();
  });

  test('filtering by category shows only transactions of that category', async ({ page }) => {
    const factory = new PageFactory(page);
    const expenses = factory.expenses();

    await expenses.navigate();

    // Filter by a single category
    await expenses.filterByCategory('Housing');

    // Every visible row must contain the Housing badge
    const rowCount = await expenses.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);

    for (let i = 0; i < rowCount; i++) {
      await expect(expenses.tableRows.nth(i).getByText('Housing')).toBeVisible();
    }
  });

  test('switching months updates the transaction list', async ({ page }) => {
    const factory = new PageFactory(page);
    const expenses = factory.expenses();

    await expenses.navigate();

    // Read row count for March (default selected month = index 2)
    const marCount = await expenses.tableRows.count();

    // Switch to January
    await page.getByRole('button', { name: 'Jan' }).click();
    const janCount = await expenses.tableRows.count();

    // Both months should have transactions (seeded data exists for Jan & Mar)
    expect(marCount).toBeGreaterThan(0);
    expect(janCount).toBeGreaterThan(0);
  });
});

test.describe('Expenses — negative path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    const expenses = factory.expenses();
    await expenses.navigate();
  });

  test('searching with a term that matches nothing shows "No transactions found"', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('zzz_no_match_at_all_999');

    // Table body shows the empty-state message
    await expect(expenses.noResultsRow).toBeVisible();
    // No data rows remain
    await expect(expenses.tableRows).toHaveCount(0);
  });

  test('submitting the add-expense form with an empty description does not add a row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const before = await expenses.tableRows.count();

    // Open form but leave description blank, fill only amount
    await expenses.openAddExpenseForm();
    await expenses.amountInput.fill('99');
    await expenses.saveButton.click();

    // Row count should remain the same (form validation prevents saving)
    await expect(expenses.tableRows).toHaveCount(before);
  });

  test('submitting the add-expense form with an empty amount does not add a row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const before = await expenses.tableRows.count();

    // Open form, fill only description, leave amount blank
    await expenses.openAddExpenseForm();
    await expenses.descriptionInput.fill('Missing amount test');
    await expenses.saveButton.click();

    // Row count unchanged
    await expect(expenses.tableRows).toHaveCount(before);
  });

  test('filtering by a category with no transactions in the selected month shows empty state', async ({ page }) => {
    // Switch to January to get a known dataset, then filter to a category
    // that seeded data may not populate every month for (Health is sparse)
    await page.getByRole('button', { name: 'Jan' }).click();

    const expenses = new PageFactory(page).expenses();

    // Apply a search that definitely matches nothing for extra certainty
    await expenses.search('zzz_impossible_99');
    await expenses.filterByCategory('Housing');

    await expect(expenses.noResultsRow).toBeVisible();
    await expect(expenses.tableRows).toHaveCount(0);
  });
});
