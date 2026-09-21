import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Expenses tab.
 *
 * User story: As an authenticated user I can view, search, filter and sort
 * my monthly transactions, and I can add a new expense that immediately
 * appears in the list and updates the running total.
 *
 * These tests are generated from the Expenses feature completed in the
 * current sprint (Jira-done-ticket proxy, 2026-09-21).
 */

test.describe('Expenses tab — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we are inside the app before navigating
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.expenses().navigate();
    // Wait for the Expenses heading to confirm the tab rendered
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  // Happy Test 1 — Expenses tab loads and shows the transaction table
  test('Expenses tab shows the transaction table with at least one row', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // The table must contain rows (seeded data always has transactions)
    await expect(expensesPage.tableRows).not.toHaveCount(0);
  });

  // Happy Test 2 — Add Expense button reveals the inline form
  test('clicking Add Expense reveals the new-expense form', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    await expensesPage.openAddForm();

    // The form panel heading and Save button must be visible
    await expect(expensesPage.formPanel).toBeVisible();
    await expect(expensesPage.saveButton).toBeVisible();
  });

  // Happy Test 3 — New expense appears in the list immediately after saving
  test('adding a new expense appends it to the transaction list', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    const countBefore = await expensesPage.tableRows.count();

    // Open form, fill in, save
    await expensesPage.openAddForm();
    await expensesPage.descriptionInput.fill('Test coffee purchase');
    await expensesPage.amountInput.fill('7.50');
    await expensesPage.saveButton.click();

    // Row count must increase by exactly 1
    await expect(expensesPage.tableRows).toHaveCount(countBefore + 1);

    // The new description must appear somewhere in the table
    await expect(page.getByText('Test coffee purchase')).toBeVisible();
  });

  // Happy Test 4 — Footer total updates when a new expense is added
  test('footer running total increases after adding an expense', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // Capture the footer total text before
    const totalBefore = await expensesPage.footerTotal.textContent();

    await expensesPage.openAddForm();
    await expensesPage.descriptionInput.fill('Extra grocery run');
    await expensesPage.amountInput.fill('50.00');
    await expensesPage.saveButton.click();

    // Wait for re-render
    await expect(expensesPage.tableRows).not.toHaveCount(0);

    const totalAfter = await expensesPage.footerTotal.textContent();
    // The totals must differ (new amount was added)
    expect(totalAfter).not.toEqual(totalBefore);
  });

  // Happy Test 5 — Searching filters the table to matching descriptions only
  test('searching by description filters rows to matching transactions', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // 'Rent' is a seeded Housing transaction that appears every month
    await expensesPage.search('Rent');

    // Every visible row must contain "Rent" in its description cell
    const descCells = page.locator('tbody tr td:nth-child(2)');
    const count = await descCells.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(descCells.nth(i)).toContainText('Rent', { ignoreCase: true });
    }
  });

  // Happy Test 6 — Category filter narrows the list to one category
  test('selecting a category filter shows only transactions of that category', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    await expensesPage.filterByCategory('Health');

    // All category badge cells must show "Health"
    const categoryBadges = page.locator('tbody tr td:nth-child(3)');
    const count = await categoryBadges.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(categoryBadges.nth(i)).toContainText('Health');
    }
  });

  // Happy Test 7 — Clicking the Amount column header sorts rows by amount
  test('sorting by Amount reorders the transaction list', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // Click Amount header to sort descending
    await expensesPage.sortAmount.click();
    await expect(expensesPage.tableRows.first()).toBeVisible();

    // Collect the first three amount cells and verify descending order
    const amountCells = page.locator('tbody tr td:last-child');
    const first = await amountCells.first().textContent();
    const second = await amountCells.nth(1).textContent();

    const parse = (s: string | null) => parseFloat((s ?? '0').replace(/[^0-9.]/g, ''));
    expect(parse(first)).toBeGreaterThanOrEqual(parse(second));
  });
});
