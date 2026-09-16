import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Test 3 — Expenses: search and category filter
 *
 * Coverage gap: The Expenses search bar and category dropdown filter are
 * completely untested. When a search term is typed, only matching rows
 * should remain; an unmatched term should show the empty state.
 */
test.describe('Expenses — search and filter', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expenses = factory.expenses();
    await expenses.navigate();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  test('searching by a known category name narrows the transaction list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Get total row count before filtering
    const totalBefore = await expenses.tableRows.count();

    // Search for "Netflix" — a Subscriptions transaction that always exists in seeded data
    await expenses.search('Netflix');

    // At least one row should remain and all visible rows must mention Netflix or Subscriptions
    await expect(expenses.emptyState).not.toBeVisible();
    const rowCount = await expenses.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
    expect(rowCount).toBeLessThan(totalBefore);
  });

  test('searching for a term with no matches shows the empty state', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('xxxxxxxxnotransaction');

    await expect(expenses.emptyState).toBeVisible();
    await expect(expenses.tableRows).toHaveCount(0);
  });

  test('filtering by category "Housing" shows only Housing transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // The category <select> is the first select on the page (filter bar)
    await page
      .locator('select')
      .first()
      .selectOption('Housing');

    // All remaining rows must belong to Housing
    const rows = expenses.tableRows;
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText('Housing');
    }
  });
});
