import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.describe('Expenses', () => {
  let factory: PageFactory;

  test.beforeEach(async ({ page }) => {
    factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
  });

  // ════════════════════════════════════════════════════════════════════════════
  // SMOKE TESTS
  // Verify the Expenses page is reachable and the core UI shell is intact.
  // These run first — if they fail the functional tests below won't be reliable.
  // ════════════════════════════════════════════════════════════════════════════

  test.describe('[Smoke] Expenses', () => {
    test('Expenses page is reachable and renders the heading', async ({ page }) => {
      const expenses = factory.expenses();

      // Sidebar "Expenses" button becomes active after navigation
      await expect(
        page.getByRole('button', { name: /expenses/i })
      ).toHaveClass(/text-emerald-400/);

      // Page heading is visible
      await expect(expenses.heading).toBeVisible();

      // Top bar title confirms active section
      await expect(page.locator('header h1')).toHaveText('expenses');
    });

    test('expenses table renders with data rows and a summary footer', async ({ page }) => {
      const expenses = factory.expenses();

      // There should be at least one data row in the table (seeded data)
      await expect(expenses.tableRows.first()).toBeVisible();
      const rowCount = await expenses.tableRows.count();
      expect(rowCount).toBeGreaterThan(0);

      // Summary footer is present and shows a transaction count and total
      await expect(expenses.tableSummary).toBeVisible();
      await expect(expenses.tableSummary).toContainText(/transaction/i);
      await expect(expenses.tableSummary).toContainText(/total/i);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // BLACK BOX TESTS
  // Validate functional behavior from the user's perspective:
  // the Add Expense flow, filtering, and search — without assumptions
  // about internal state management.
  // ════════════════════════════════════════════════════════════════════════════

  test.describe('[Black Box] Expenses', () => {
    test('user can add a new expense and it appears in the table', async ({ page }) => {
      const expenses = factory.expenses();

      // Record the current row count before adding
      const rowsBefore = await expenses.tableRows.count();

      // Fill and submit the Add Expense form
      await expenses.addExpense('Playwright test coffee', 7.50, 'Food', '2026-03-15');

      // Table should now contain one more row than before
      await expect(expenses.tableRows).toHaveCount(rowsBefore + 1);

      // The new row should contain the description we entered
      await expect(
        page.locator('tbody').getByText('Playwright test coffee')
      ).toBeVisible();
    });

    test('category filter shows only transactions of the selected category', async ({ page }) => {
      const expenses = factory.expenses();

      // Apply the Housing category filter
      await expenses.filterByCategory('Housing');

      // Every visible row in the table must contain "Housing" as its category
      const rows = expenses.tableRows;
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i)).toContainText('Housing');
      }

      // Clearing the filter restores all rows
      await expenses.clearCategoryFilter();
      const allRows = await expenses.tableRows.count();
      expect(allRows).toBeGreaterThan(count);
    });

    test('keyword search narrows the table to matching transactions', async ({ page }) => {
      const expenses = factory.expenses();

      // Search for a known seeded description substring
      await expenses.searchFor('Netflix');

      const rows = expenses.tableRows;
      const count = await rows.count();

      // At least one row should match
      expect(count).toBeGreaterThan(0);

      // Every visible row should contain the search term (case-insensitive)
      for (let i = 0; i < count; i++) {
        const text = await rows.nth(i).textContent();
        expect(text?.toLowerCase()).toContain('netflix');
      }

      // Clearing the search restores more rows
      await expenses.clearSearch();
      const allRows = await expenses.tableRows.count();
      expect(allRows).toBeGreaterThan(count);
    });
  });
});
