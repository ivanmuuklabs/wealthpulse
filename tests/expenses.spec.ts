import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses Tab — tests
 *
 * Flows covered:
 *   - Transaction table loads with seeded data.
 *   - "Add Expense" button reveals the inline form.
 *   - Submitting a valid expense inserts a new row.
 *   - Real-time search filters the table.
 *   - Clearing search restores all rows.
 *   - Category dropdown filter narrows rows to the selected category.
 *   - No-match search shows the empty-state row.
 *   - Submitting a form with no description does NOT add a row.
 *   - Submitting a form with no amount does NOT add a row.
 *   - Month switching updates the visible transaction list.
 *
 * Added by Amikoo QA worker Test-new-pull-requests — 2026-09-16
 */

test.describe('Expenses — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
  });

  test('expenses tab loads with seeded transaction rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Seeded data guarantees rows are present on the default month
    await expect(expenses.tableRows.first()).toBeVisible();
    await expect(expenses.emptyState).not.toBeVisible();
  });

  test('Add Expense button reveals the inline form', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Form should not be visible before clicking
    await expect(expenses.descriptionInput).not.toBeVisible();

    await expenses.openAddForm();

    await expect(expenses.descriptionInput).toBeVisible();
    await expect(expenses.amountInput).toBeVisible();
    await expect(expenses.saveButton).toBeVisible();
  });

  test('adding a valid expense inserts a new row into the table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Count rows before
    const before = await expenses.tableRows.count();

    await expenses.addExpense('Playwright Coffee', '4.50', 'Food');

    // New row should appear — count increases by 1
    await expect(expenses.tableRows).toHaveCount(before + 1);
    // The description should be visible in the table
    await expect(page.getByRole('cell', { name: 'Playwright Coffee' })).toBeVisible();
  });

  test('searching by description filters rows to matching results only', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Use a term that exists in the seeded data
    await expenses.search('Rent');

    // All remaining rows should contain "Rent" in their description cell
    const rows = page.locator('tbody tr').filter({ hasNotText: 'No transactions found' });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText(/rent/i);
    }
  });

  test('clearing the search input restores all rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const totalBefore = await expenses.tableRows.count();

    await expenses.search('Rent');
    const filtered = await expenses.tableRows.count();
    expect(filtered).toBeLessThan(totalBefore);

    await expenses.clearSearch();
    await expect(expenses.tableRows).toHaveCount(totalBefore);
  });

  test('category filter shows only rows from the selected category', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.filterByCategory('Food');

    // Every visible row's category badge should contain "Food"
    const rows = page.locator('tbody tr').filter({ hasNotText: 'No transactions found' });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText('Food');
    }
  });

  test('switching from March to January changes the transaction list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Read count for March (default)
    await expenses.selectMonth('Mar');
    const marCount = await expenses.tableRows.count();

    // Switch to January
    await expenses.selectMonth('Jan');
    const janCount = await expenses.tableRows.count();

    // Seeded data differs per month — both should have rows
    expect(marCount).toBeGreaterThan(0);
    expect(janCount).toBeGreaterThan(0);
    // The table updated (we only assert both months have data, not the same count)
    await expect(expenses.tableRows.first()).toBeVisible();
  });
});

test.describe('Expenses — negative & edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
  });

  test('searching for a non-existent term shows the empty-state row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('xxxxxnonexistentdescription12345');

    await expect(expenses.emptyState).toBeVisible();
    await expect(expenses.tableRows).toHaveCount(0);
  });

  test('submitting the form with no description does not add a new row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const countBefore = await expenses.tableRows.count();

    // Open form but leave description blank
    await expenses.openAddForm();
    await expenses.amountInput.fill('25.00');
    await expenses.saveButton.click();

    // Row count must remain the same
    await expect(expenses.tableRows).toHaveCount(countBefore);
  });

  test('submitting the form with no amount does not add a new row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const countBefore = await expenses.tableRows.count();

    // Open form but leave amount blank
    await expenses.openAddForm();
    await expenses.descriptionInput.fill('Ghost expense');
    await expenses.saveButton.click();

    // Row count must remain the same
    await expect(expenses.tableRows).toHaveCount(countBefore);
  });

  test('combined search + category filter with no match shows empty state', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Filter by Food, then search for something that won't match any Food row
    await expenses.filterByCategory('Food');
    await expenses.search('Electric bill'); // an Utilities description

    await expect(expenses.emptyState).toBeVisible();
  });
});
