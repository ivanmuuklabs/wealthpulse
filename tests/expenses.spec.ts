import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses tab — functional coverage tests.
 *
 * Covers three untested flows:
 *  3. Add Expense: submitting the form adds the new transaction to the table.
 *  4. Search / Filter: typing in the search box reduces the visible rows.
 *
 * Settings tab — functional coverage test:
 *  5. Save Profile: updating the full name persists in the UI after saving.
 *
 * Each test is fully independent — it logs in fresh via loginAsDemo().
 */

test.describe('Expenses — add and search flows', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Expenses tab
    const expensesPage = factory.expenses();
    await expensesPage.navigate();
  });

  // Test 3 — Adding a new expense makes it appear in the transaction table
  test('adding a new expense inserts it into the transaction table', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // Record the row count before adding
    const initialCount = await expensesPage.tableRows.count();

    // Open the form and add a uniquely named expense
    await expensesPage.openAddForm();
    await expensesPage.addExpense('Playwright automation lunch', 18.50, 'Food');

    // The form closes automatically — the new row should now appear
    await expect(expensesPage.tableRows).toHaveCount(initialCount + 1);

    // The description text must be visible somewhere in the table
    await expect(page.getByText('Playwright automation lunch')).toBeVisible();
  });

  // Test 4 — The search box filters the transaction list to matching rows only
  test('searching by description filters the transaction list', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // Capture total rows for the month (unfiltered)
    const totalRows = await expensesPage.tableRows.count();

    // Search for a term that is guaranteed to match a subset of seeded data
    // "Rent" appears only in Housing transactions ("Rent payment")
    await expensesPage.search('Rent');

    // The filtered count must be strictly less than the unfiltered count
    const filteredCount = await expensesPage.tableRows.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(totalRows);

    // Every visible row must contain the search term in its description cell
    for (let i = 0; i < filteredCount; i++) {
      const rowText = await expensesPage.tableRows.nth(i).textContent();
      expect(rowText?.toLowerCase()).toContain('rent');
    }

    // Clearing the search restores all rows
    await expensesPage.search('');
    await expect(expensesPage.tableRows).toHaveCount(totalRows);
  });
});

test.describe('Settings — profile save flow', () => {
  // Test 5 — Saving an updated full name persists in the settings profile card
  test('saving an updated full name reflects in the profile display', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to Settings via the sidebar
    const settingsPage = factory.settings();
    await settingsPage.navigate(page);

    // Update the name and save
    const newName = 'Jordan Rivera';
    await settingsPage.updateFullName(newName);

    // The save button briefly shows "✓ Saved!" as confirmation
    await expect(settingsPage.saveButton).toHaveText(/✓ Saved/i);

    // After the confirmation fades the name input must hold the new value
    await expect(settingsPage.fullNameInput).toHaveValue(newName);

    // The profile card paragraph (above the form) also shows the updated name
    await expect(page.locator('p.text-white.font-semibold').filter({ hasText: newName })).toBeVisible();
  });
});
