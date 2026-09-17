import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Edge-case and negative tests for the Expenses tab.
 *
 * The PR's expenses.spec.ts covers the happy paths (add expense, category
 * filter, keyword search). This companion spec covers the boundary flows
 * introduced by the same ExpensesPage POM:
 *   1. Empty-state message when no transactions match a search
 *   2. Form validation: submitting with an empty description adds nothing
 *   3. Form validation: submitting with an empty amount adds nothing
 *   4. Footer total reflects only the visible (filtered) transactions
 *   5. Clearing search after filtering restores the full list
 */

test.describe('Expenses tab — edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to Expenses
    const expenses = factory.expenses();
    await expenses.navigate();
  });

  test('searching with a no-match term shows the empty-state message', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('zzz_no_match_ever_zzz');

    // The "No transactions found" empty-state cell must appear
    await expect(expenses.emptyState).toBeVisible();
    // No data rows should be present
    await expect(expenses.tableRows).toHaveCount(0);
  });

  test('submitting the Add Expense form with an empty description does not add a row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const initialCount = await expenses.tableRows.count();

    await expenses.openAddForm();
    // Leave description empty — only fill amount
    await expenses.amountInput.fill('99.99');
    await expenses.saveButton.click();

    // Row count must not have increased (app guards require a non-empty description)
    const afterCount = await expenses.tableRows.count();
    expect(afterCount).toEqual(initialCount);
  });

  test('submitting the Add Expense form with an empty amount does not add a row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const initialCount = await expenses.tableRows.count();

    await expenses.openAddForm();
    // Fill description but leave amount empty
    await expenses.descriptionInput.fill('Ghost Expense');
    await expenses.saveButton.click();

    // Row count must not have increased
    const afterCount = await expenses.tableRows.count();
    expect(afterCount).toEqual(initialCount);
  });

  test('footer transaction count matches the number of visible rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Apply a category filter so we have a smaller, known set
    await expenses.filterByCategory('Transport');

    const rowCount = await expenses.tableRows.count();

    // The footer shows "{n} transaction(s)" — verify it matches the DOM row count
    await expect(expenses.tableFooter).toContainText(String(rowCount));
  });

  test('clearing search after filtering restores all rows for the selected category', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Filter to Food category first, then apply a keyword search that narrows further
    await expenses.filterByCategory('Food');
    const foodCount = await expenses.tableRows.count();

    // Apply a very specific search that should match fewer rows
    await expenses.search('Coffee');
    const narrowedCount = await expenses.tableRows.count();
    expect(narrowedCount).toBeLessThanOrEqual(foodCount);

    // Clear search — should return to the full Food category list
    await expenses.search('');
    const restoredCount = await expenses.tableRows.count();
    expect(restoredCount).toEqual(foodCount);
  });
});
