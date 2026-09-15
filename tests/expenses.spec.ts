import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses tab tests
 *
 * User story: As a user I can view my monthly expenses, add new transactions,
 * search and filter them, and sort the table — so I can manage my spending.
 *
 * Happy path:  primary success flows (viewing, adding, searching, filtering, sorting).
 * Negative:    edge cases, invalid inputs, and boundary conditions.
 */

test.describe('Expenses — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Wait until we are inside the dashboard before navigating
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('Expenses tab loads with a non-empty transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    // The page heading and at least one data row should be visible
    await expect(expenses.heading).toBeVisible();
    await expect(expenses.transactionRows.first()).toBeVisible();
  });

  test('Add Expense form is hidden by default and opens on button click', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    // Form fields must not be visible before clicking "Add Expense"
    await expect(expenses.formDescriptionInput).not.toBeVisible();

    await expenses.addExpenseButton.click();

    // After clicking, the description field becomes visible
    await expect(expenses.formDescriptionInput).toBeVisible();
  });

  test('adding a new expense appends it to the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    // Record the current row count
    const rowsBefore = await expenses.transactionRows.count();

    // Add a new expense in the currently selected month (March 2026 by default)
    await expenses.addExpense('Test Coffee Purchase', 4.50, 'Food', '2026-03-20');

    // The table should now have one more row
    const rowsAfter = await expenses.transactionRows.count();
    expect(rowsAfter).toBeGreaterThan(rowsBefore);

    // The new transaction description is visible in the table
    await expect(page.getByText('Test Coffee Purchase')).toBeVisible();
  });

  test('searching transactions filters the table to matching rows only', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    // Search for a specific description that is guaranteed to be in the seed data
    await expenses.search('Rent');

    // At least one row should match; all visible descriptions must contain "rent"
    const count = await expenses.transactionRows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const text = await expenses.transactionRows.nth(i).textContent();
      expect(text?.toLowerCase()).toContain('rent');
    }
  });

  test('filtering by category shows only transactions in that category', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    await expenses.filterByCategory('Health');

    // Every visible row should show the "Health" category badge
    const count = await expenses.transactionRows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const text = await expenses.transactionRows.nth(i).textContent();
      expect(text).toContain('Health');
    }
  });

  test('clicking the Date column header sorts the table in descending order by default', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    // Click Date column to sort
    await expenses.clickSortHeader('Date');

    // Read the first two date cells and confirm descending order
    const firstDate = await expenses.transactionRows.first().locator('td').first().textContent();
    const secondDate = await expenses.transactionRows.nth(1).locator('td').first().textContent();

    expect(firstDate).not.toBeNull();
    expect(secondDate).not.toBeNull();
    // Descending: first date >= second date (string comparison works for ISO dates)
    expect((firstDate ?? '').localeCompare(secondDate ?? '')).toBeGreaterThanOrEqual(0);
  });

  test('clicking the Amount column header sorts transactions by amount descending', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    await expenses.clickSortHeader('Amount');

    // Verify the first row's amount is >= the second row's amount
    const parseAmount = (text: string | null) =>
      parseFloat((text ?? '').replace(/[^0-9.]/g, ''));

    const firstAmt = parseAmount(
      await expenses.transactionRows.first().locator('td').last().textContent()
    );
    const secondAmt = parseAmount(
      await expenses.transactionRows.nth(1).locator('td').last().textContent()
    );

    expect(firstAmt).toBeGreaterThanOrEqual(secondAmt);
  });

  test('month switcher updates the transaction list for February', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    // Switch to February
    await page.getByRole('button', { name: 'Feb' }).click();

    // All visible transaction dates should belong to February 2026
    const count = await expenses.transactionRows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const dateText = await expenses.transactionRows.nth(i).locator('td').first().textContent();
      expect(dateText).toMatch(/^2026-02/);
    }
  });
});

test.describe('Expenses — negative / edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('searching with a term that matches nothing shows the empty-state message', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    // A term that will never match any seeded transaction
    await expenses.search('xxxxxxxxzzznotfound999');

    await expect(expenses.noTransactionsMessage).toBeVisible();
    await expect(expenses.transactionRows).toHaveCount(0);
  });

  test('submitting the Add Expense form with an empty description does not add a row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    const rowsBefore = await expenses.transactionRows.count();

    // Open form but leave description blank, fill only amount
    await expenses.addExpenseButton.click();
    await expenses.formAmountInput.fill('50');
    // Do NOT fill description
    await expenses.formSaveButton.click();

    // Row count must be unchanged — the app requires description to save
    const rowsAfter = await expenses.transactionRows.count();
    expect(rowsAfter).toEqual(rowsBefore);
  });

  test('submitting the Add Expense form with an empty amount does not add a row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    const rowsBefore = await expenses.transactionRows.count();

    // Open form, fill description but leave amount blank
    await expenses.addExpenseButton.click();
    await expenses.formDescriptionInput.fill('Incomplete expense');
    // Do NOT fill amount
    await expenses.formSaveButton.click();

    const rowsAfter = await expenses.transactionRows.count();
    expect(rowsAfter).toEqual(rowsBefore);
  });

  test('filtering by category and then clearing search restores all category rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    // Filter to Housing, then search something that hides rows
    await expenses.filterByCategory('Housing');
    const housingCount = await expenses.transactionRows.count();

    await expenses.search('xxxxxxxxnotfound');
    await expect(expenses.noTransactionsMessage).toBeVisible();

    // Clearing the search should restore Housing rows
    await expenses.search('');
    const restoredCount = await expenses.transactionRows.count();
    expect(restoredCount).toEqual(housingCount);
  });

  test('adding an expense in February does not appear when March is selected', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    // Ensure we are on February
    await page.getByRole('button', { name: 'Feb' }).click();

    // Add a uniquely named expense in February
    await expenses.addExpense('UniqueFebruaryExpense', 99.99, 'Shopping', '2026-02-10');

    // Verify it is visible in February
    await expect(page.getByText('UniqueFebruaryExpense')).toBeVisible();

    // Switch to March — the February expense must not appear
    await page.getByRole('button', { name: 'Mar' }).click();
    await expect(page.getByText('UniqueFebruaryExpense')).not.toBeVisible();
  });

  test('footer total reflects the sum of visible filtered transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    // Filter to a single known category to keep the math bounded
    await expenses.filterByCategory('Subscriptions');

    // Sum up all visible amounts from the table
    const count = await expenses.transactionRows.count();
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const amtText = await expenses.transactionRows.nth(i).locator('td').last().textContent();
      sum += parseFloat((amtText ?? '').replace(/[^0-9.]/g, ''));
    }

    // The footer total text should include the same rounded value
    const footerText = await page.locator('div').filter({ hasText: /Total:/ }).last().textContent();
    const footerAmount = parseFloat((footerText ?? '').replace(/[^0-9.]/g, ''));

    expect(Math.abs(footerAmount - sum)).toBeLessThanOrEqual(1); // allow $1 rounding tolerance
  });
});
