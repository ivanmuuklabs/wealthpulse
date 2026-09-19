import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses tab — happy path and negative tests.
 *
 * User story: As a logged-in user I can view my transactions for a selected
 * month, add new expenses, search and filter the list, and sort by column
 * headers — so that I can track and manage my spending.
 *
 * Covers:
 *  Happy path — navigating to the tab, reading the list, adding a transaction,
 *               searching/filtering, and verifying the footer totals.
 *  Negative  — empty search results message, form ignored when required fields
 *               are missing, and category filter isolating rows correctly.
 */

test.describe('Expenses tab — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
  });

  test('Expenses tab is reachable and displays the transaction table', async ({ page }) => {
    // Heading is visible
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();

    // At least one transaction row is rendered for the default month (March)
    const expensesPage = new PageFactory(page).expenses();
    await expect(expensesPage.tableRows.first()).toBeVisible();
  });

  test('footer count matches the number of visible table rows', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    const rowCount = await expensesPage.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Footer shows "<n> transaction(s)"
    const footerText = await expensesPage.footerCount.textContent();
    expect(footerText).toContain(String(rowCount));
  });

  test('adding a new expense appends it to the top of the table', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    const rowsBefore = await expensesPage.tableRows.count();

    await expensesPage.addExpense({
      date: '2026-03-20',
      description: 'Amikoo QA Subscription',
      amount: '49.99',
      category: 'Subscriptions',
    });

    // One extra row should appear
    await expect(expensesPage.tableRows).toHaveCount(rowsBefore + 1);

    // The new description is visible in the table
    await expect(page.getByRole('cell', { name: 'Amikoo QA Subscription' })).toBeVisible();
  });

  test('searching by description narrows the visible rows', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // First add a uniquely-named transaction so we have something stable to search
    await expensesPage.addExpense({
      description: 'UniqueGroceryTrip',
      amount: '75.00',
      category: 'Food',
    });

    await expensesPage.search('UniqueGroceryTrip');

    // Only the matching row(s) remain
    await expect(expensesPage.tableRows).toHaveCount(1);
    await expect(page.getByRole('cell', { name: 'UniqueGroceryTrip' })).toBeVisible();
  });

  test('filtering by category shows only transactions in that category', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    await expensesPage.filterByCategory('Health');

    const rows = expensesPage.tableRows;
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Every visible badge must show "Health"
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      await expect(row.getByText('Health')).toBeVisible();
    }
  });

  test('switching month selector to February updates the transaction list', async ({ page }) => {
    // Default is March; switch to February and confirm the table re-renders
    await page.getByRole('button', { name: 'Feb' }).click();

    const expensesPage = new PageFactory(page).expenses();
    // There should still be rows — Feb also has seeded data
    await expect(expensesPage.tableRows.first()).toBeVisible();

    // Date cells should contain "2026-02-"
    const firstDate = await page.locator('table tbody td').first().textContent();
    expect(firstDate).toMatch(/2026-02-/);
  });

  test('Add Expense button toggles the form open and closed', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // Form should not be visible initially
    await expect(expensesPage.formDescriptionInput).not.toBeVisible();

    // Open form
    await expensesPage.addExpenseButton.click();
    await expect(expensesPage.formDescriptionInput).toBeVisible();

    // Close form (toggle off)
    await expensesPage.addExpenseButton.click();
    await expect(expensesPage.formDescriptionInput).not.toBeVisible();
  });
});

test.describe('Expenses tab — negative tests', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
  });

  test('searching for a non-existent term shows the empty-state message', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    await expensesPage.search('zzzNOTHINGMATCHES999');

    await expect(expensesPage.noTransactionsMessage).toBeVisible();
    await expect(expensesPage.tableRows).toHaveCount(0);
  });

  test('submitting the add-expense form with no description does not add a row', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();
    const rowsBefore = await expensesPage.tableRows.count();

    // Open form, fill amount but leave description blank, then attempt to save
    await expensesPage.addExpenseButton.click();
    await expensesPage.formAmountInput.fill('25.00');
    await expensesPage.formSaveButton.click();

    // Row count must stay the same
    await expect(expensesPage.tableRows).toHaveCount(rowsBefore);
  });

  test('submitting the add-expense form with no amount does not add a row', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();
    const rowsBefore = await expensesPage.tableRows.count();

    await expensesPage.addExpenseButton.click();
    await expensesPage.formDescriptionInput.fill('Ghost expense');
    // Amount left empty
    await expensesPage.formSaveButton.click();

    await expect(expensesPage.tableRows).toHaveCount(rowsBefore);
  });

  test('combining search and category filter shows only the intersection', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // Add a recognisable Food transaction
    await expensesPage.addExpense({
      description: 'PizzaNightSpecial',
      amount: '32.00',
      category: 'Food',
    });

    // Filter to Health; our Food-only transaction must not appear
    await expensesPage.filterByCategory('Health');
    await expensesPage.search('PizzaNightSpecial');

    await expect(expensesPage.noTransactionsMessage).toBeVisible();
  });

  test('footer total updates to $0.00 when the search yields no results', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    await expensesPage.search('ABSOLUTELYNOTHING12345');

    const footerTotalText = await expensesPage.footerTotal.textContent();
    expect(footerTotalText).toContain('$0.00');
  });
});
