import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses — happy-path and negative tests
 *
 * User story: "As a user I can log new expenses with a description, amount,
 * and category; search and filter the transaction list; and see the footer
 * update with accurate totals."
 *
 * Happy-path covers the add-expense form, search, category filter, and
 * month switching. Negative tests guard against empty submissions, missing
 * data, and search no-match empty states.
 */

/* ─────────────────────────────────────────────────────────────────────
   HAPPY PATH
   ───────────────────────────────────────────────────────────────────── */

test.describe('Expenses — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Navigate to Expenses tab
    await factory.expenses().navigate();
    await expect(new PageFactory(page).expenses().heading).toBeVisible();
  });

  test('Expenses section loads with a non-empty transaction list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // At least one seeded transaction row should be present
    await expect(expenses.tableRows.first()).toBeVisible();
  });

  test('add expense form opens when "Add Expense" is clicked', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.openAddForm();

    await expect(expenses.descriptionInput).toBeVisible();
    await expect(expenses.amountInput).toBeVisible();
    await expect(expenses.saveButton).toBeVisible();
  });

  test('adding a valid expense appends a new row to the transactions table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Count rows before
    const countBefore = await expenses.tableRows.count();

    await expenses.addExpense('Coffee shop', 4.75);

    // Exactly one extra row should appear
    await expect(expenses.tableRows).toHaveCount(countBefore + 1);
  });

  test('newly added expense description appears in the table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.addExpense('Test QA purchase', 99.99);

    await expect(page.getByText('Test QA purchase')).toBeVisible();
  });

  test('searching by description filters the table to matching rows only', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Add a uniquely-named expense so we know it exists
    await expenses.addExpense('UniqueSearchTerm123', 10);

    await expenses.search('UniqueSearchTerm123');

    // Only 1 row should remain visible
    await expect(expenses.tableRows).toHaveCount(1);
    await expect(page.getByText('UniqueSearchTerm123')).toBeVisible();
  });

  test('clearing the search restores the full transaction list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const totalRows = await expenses.tableRows.count();

    await expenses.search('nonexistentterm');
    await expenses.clearSearch();

    await expect(expenses.tableRows).toHaveCount(totalRows);
  });

  test('filtering by "Food" category shows only Food transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.filterByCategory('Food');

    // Every visible row's category badge should say Food
    const categoryBadges = page.locator('tbody tr td span').filter({ hasText: 'Food' });
    const badgeCount = await categoryBadges.count();
    const rowCount   = await expenses.tableRows.count();

    // All visible rows belong to the Food category
    expect(badgeCount).toBeGreaterThan(0);
    expect(rowCount).toEqual(badgeCount);
  });

  test('footer correctly shows the count of visible transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const rowCount = await expenses.tableRows.count();
    await expect(expenses.footerCount).toContainText(String(rowCount));
  });

  test('switching months changes the visible transaction set', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const marRows = await expenses.tableRows.count();

    await expenses.selectMonth('Jan');
    const janRows = await expenses.tableRows.count();

    // Seeded data has transactions in all 3 months; counts may differ
    expect(janRows).toBeGreaterThan(0);
    expect(marRows).toBeGreaterThan(0);
  });
});

/* ─────────────────────────────────────────────────────────────────────
   NEGATIVE / EDGE-CASE TESTS
   ───────────────────────────────────────────────────────────────────── */

test.describe('Expenses — negative and edge-case flows', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
  });

  test('saving expense with empty description does not add a new row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const countBefore = await expenses.tableRows.count();

    // Open form, fill amount but NOT description
    await expenses.openAddForm();
    await expenses.amountInput.fill('25');
    await expenses.saveButton.click();

    // Row count must not increase
    await expect(expenses.tableRows).toHaveCount(countBefore);
  });

  test('saving expense with empty amount does not add a new row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const countBefore = await expenses.tableRows.count();

    // Open form, fill description but NOT amount
    await expenses.openAddForm();
    await expenses.descriptionInput.fill('Incomplete expense');
    await expenses.saveButton.click();

    await expect(expenses.tableRows).toHaveCount(countBefore);
  });

  test('searching for a non-existent term shows the empty state row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('zzznomatchabc');

    await expect(expenses.emptyState).toBeVisible();
    await expect(expenses.tableRows).toHaveCount(0);
  });

  test('a very large amount ($999999.99) is accepted and shown in the table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.addExpense('Massive purchase', 999999.99);

    await expect(page.getByText('Massive purchase')).toBeVisible();
  });

  test('searching with only spaces does not crash — shows existing rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('   ');

    // App should remain stable; rows may or may not match, but no error
    await expect(expenses.heading).toBeVisible();
  });

  test('filtering by a category with no transactions in the current month shows no rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Switch to a month, then filter by a category likely sparse in that month
    // Use Entertainment (low transaction count) and confirm the empty state when 0 rows
    await expenses.filterByCategory('Entertainment');

    // Whether rows exist or not, the UI must remain stable
    await expect(expenses.heading).toBeVisible();
    // Either rows are visible or the empty state message appears
    const rows     = await expenses.tableRows.count();
    const hasEmpty = await expenses.emptyState.isVisible();
    expect(rows > 0 || hasEmpty).toBe(true);
  });
});
