import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Feature tests for the Waste tab introduced by PR #13.
 *
 * waste.spec.ts already covers the rename, heading, month-selector count, and
 * navigation. This suite covers the interactive features of the tab:
 *
 *  1. Search input filters transactions in real time
 *  2. Category dropdown filters transactions to the selected category
 *  3. Combining search + category filter narrows results further
 *  4. The "Add Expense" button opens the form; submitting adds a new row
 *  5. Column sorting (Amount) toggles asc/desc order
 *  6. Footer shows the correct transaction count after filtering
 *  7. The "Add Expense" button label is preserved after the rename
 */

test.describe('Waste tab — interactive features', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    // Log in and navigate to the Waste tab before every test
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.waste().navigate();
    await expect(factory.waste().heading).toBeVisible();
  });

  // ── 1. Search filtering ─────────────────────────────────────────────────────

  test('search input filters transaction rows in real time', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Capture baseline row count for January (default month)
    const baseCount = await waste.tableRows.count();
    expect(baseCount).toBeGreaterThan(0);

    // Type a search term that targets a known category label
    await waste.search('Food');

    // Rows should be fewer (only Food transactions) or equal if all are Food
    const filteredCount = await waste.tableRows.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(baseCount);

    // Every visible row should contain "Food" somewhere in the visible text
    for (let i = 0; i < filteredCount; i++) {
      await expect(waste.tableRows.nth(i)).toContainText('Food');
    }
  });

  test('clearing the search input restores all rows for the active month', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    const baseCount = await waste.tableRows.count();

    // Filter then clear
    await waste.search('Housing');
    await waste.search('');

    await expect(waste.tableRows).toHaveCount(baseCount);
  });

  test('search term with no matching transactions shows the empty state', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // A term that cannot match any seeded description or category
    await waste.search('XYZZY_NO_MATCH_9999');

    await expect(waste.emptyState).toBeVisible();
    // The empty-state row is the only row in the tbody
    await expect(waste.tableRows).toHaveCount(1);
  });

  // ── 2. Category dropdown filter ─────────────────────────────────────────────

  test('selecting a category from the dropdown filters rows to that category only', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    await waste.filterByCategory('Transport');

    const rows = await waste.tableRows.count();
    expect(rows).toBeGreaterThan(0);

    // Every visible row badge should read "Transport"
    for (let i = 0; i < rows; i++) {
      await expect(waste.tableRows.nth(i)).toContainText('Transport');
    }
  });

  test('selecting "All Categories" after a filter restores the full list', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    const baseCount = await waste.tableRows.count();

    await waste.filterByCategory('Shopping');
    const filteredCount = await waste.tableRows.count();
    expect(filteredCount).toBeLessThan(baseCount);

    // Reset to "All"
    await waste.filterByCategory('All');
    await expect(waste.tableRows).toHaveCount(baseCount);
  });

  // ── 3. Combined search + category filter ────────────────────────────────────

  test('search and category filter combine to produce a narrower result set', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // First filter to a broad category
    await waste.filterByCategory('Food');
    const categoryOnlyCount = await waste.tableRows.count();
    expect(categoryOnlyCount).toBeGreaterThan(0);

    // Then add a search term that will further narrow results
    await waste.search("Trader");

    const combinedCount = await waste.tableRows.count();
    // Combined result must be ≤ category-only result
    expect(combinedCount).toBeLessThanOrEqual(categoryOnlyCount);

    // Every remaining row must be in Food category
    for (let i = 0; i < combinedCount; i++) {
      await expect(waste.tableRows.nth(i)).toContainText('Food');
    }
  });

  // ── 4. Add Expense form ──────────────────────────────────────────────────────

  test('"Add Expense" button opens the new-expense form', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Form should not be visible initially
    await expect(page.getByText('New Expense')).not.toBeVisible();

    await waste.addExpenseButton.click();

    // Form appears
    await expect(page.getByText('New Expense')).toBeVisible();
    await expect(waste.formDescriptionInput).toBeVisible();
    await expect(waste.formAmountInput).toBeVisible();
    await expect(waste.formSaveButton).toBeVisible();
  });

  test('clicking "Add Expense" again closes the form (toggle behaviour)', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    await waste.addExpenseButton.click();
    await expect(page.getByText('New Expense')).toBeVisible();

    // Second click should collapse the form
    await waste.addExpenseButton.click();
    await expect(page.getByText('New Expense')).not.toBeVisible();
  });

  test('submitting a new expense adds a row to the transaction table', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Baseline count for January
    const baseCount = await waste.tableRows.count();

    // Open form and submit a new entry
    await waste.openAddExpenseForm();
    await waste.addExpense('Test Coffee Shop', '12.50', 'Food');

    // Form should close automatically after Save
    await expect(page.getByText('New Expense')).not.toBeVisible();

    // Table must now have one more row
    await expect(waste.tableRows).toHaveCount(baseCount + 1);

    // The new row should be findable by searching for its description
    await waste.search('Test Coffee Shop');
    await expect(waste.tableRows).toHaveCount(1);
    await expect(waste.tableRows.first()).toContainText('Test Coffee Shop');
  });

  test('Save is disabled (no-op) when description or amount is empty', async ({ page }) => {
    const waste = new PageFactory(page).waste();
    const baseCount = await waste.tableRows.count();

    await waste.openAddExpenseForm();
    // Leave description and amount empty; click Save
    await waste.formSaveButton.click();

    // Row count must remain unchanged
    await expect(waste.tableRows).toHaveCount(baseCount);
    // Form stays open (no successful submission)
    await expect(page.getByText('New Expense')).toBeVisible();
  });

  // ── 5. Column sorting ────────────────────────────────────────────────────────

  test('clicking the Amount header sorts transactions descending then ascending', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // First click → descending (default when clicking a new sort key)
    await waste.amountColumnHeader.click();

    const rowsDesc = await waste.tableRows.count();
    expect(rowsDesc).toBeGreaterThan(1);

    // Read the first and last amounts in desc order
    const firstAmountDesc = await waste.tableRows.first().locator('td').last().textContent();
    const lastAmountDesc  = await waste.tableRows.last().locator('td').last().textContent();

    const parseAmount = (text: string | null) =>
      parseFloat((text ?? '').replace(/[^0-9.]/g, ''));

    expect(parseAmount(firstAmountDesc)).toBeGreaterThanOrEqual(parseAmount(lastAmountDesc));

    // Second click → ascending
    await waste.amountColumnHeader.click();

    const firstAmountAsc = await waste.tableRows.first().locator('td').last().textContent();
    const lastAmountAsc  = await waste.tableRows.last().locator('td').last().textContent();

    expect(parseAmount(firstAmountAsc)).toBeLessThanOrEqual(parseAmount(lastAmountAsc));
  });

  // ── 6. Footer transaction count ──────────────────────────────────────────────

  test('footer shows correct transaction count matching visible rows', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    const rowCount = await waste.tableRows.count();

    // The footer text should contain the row count as a number
    const footerText = await page.locator('table + *').textContent().catch(() => null)
      ?? await page.locator('div').filter({ hasText: /transaction/ }).last().textContent();

    expect(footerText).toMatch(new RegExp(`${rowCount}\\s+transaction`));
  });

  test('footer count updates when category filter is applied', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    await waste.filterByCategory('Health');

    const filteredRowCount = await waste.tableRows.count();

    // Footer must reflect the filtered count
    const footerText = await page.locator('div').filter({ hasText: /transaction/ }).last().textContent();
    expect(footerText).toMatch(new RegExp(`${filteredRowCount}\\s+transaction`));
  });

  // ── 7. "Add Expense" button label persists after rename ──────────────────────

  test('"Add Expense" button is still labelled "Add Expense" after the rename to Waste', async ({ page }) => {
    const waste = new PageFactory(page).waste();
    // The button label was not renamed — it still says "Add Expense", not "Add Waste"
    await expect(waste.addExpenseButton).toBeVisible();
    await expect(waste.addExpenseButton).toHaveText('Add Expense');
    await expect(page.getByRole('button', { name: 'Add Waste' })).toHaveCount(0);
  });
});
