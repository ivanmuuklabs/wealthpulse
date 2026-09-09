import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses — search & category filter
 *
 * Coverage gap: the transaction search input and category dropdown filter
 * in the Expenses tab had no tests at all. These are the primary tools users
 * use to find individual transactions, making them high-impact flows.
 */
test.describe('Expenses — search and category filter', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expenses = factory.expenses();
    await expenses.navigate();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  test('searching for a non-existent description shows the empty state', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Type a term guaranteed to match nothing in the seeded data
    await expenses.search('xxxxxxxxxnoresult');

    // The table must show the "No transactions found" empty state
    await expect(expenses.emptyState).toBeVisible();
    // And no data rows should be rendered
    await expect(expenses.transactionRows).toHaveCount(0);
  });

  test('filtering by a single category shows only transactions for that category', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Filter to Housing — the seeded data has exactly 1 Housing transaction per month
    await expenses.filterByCategory('Housing');

    // Every visible row must belong to the Housing category
    const categoryBadges = page.locator('tbody tr td span').filter({ hasText: 'Housing' });
    const rowCount = await expenses.transactionRows.count();

    expect(rowCount).toBeGreaterThan(0);
    await expect(categoryBadges).toHaveCount(rowCount);
  });
});
