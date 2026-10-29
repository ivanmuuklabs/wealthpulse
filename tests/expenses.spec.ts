import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses tab + Settings tab — critical flow coverage
 *
 * Gaps addressed:
 *   3. Adding a new expense via the form appends it to the transaction table
 *   4. Searching transactions filters the visible rows to matching entries only
 *   5. Saving profile changes in Settings reflects the updated name in the UI
 */

test.describe('Expenses — add expense and search', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Expenses tab
    await new PageFactory(page).expenses().navigate();
  });

  // Test 3 — Adding an expense via the form appears in the table
  // Verifies the full add-expense flow: open form → fill → save → row visible.
  test('adding a new expense via the form adds it to the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Capture current row count before adding
    const initialCount = await expenses.tableRows.count();

    // Open the add-expense form and submit a new entry
    await expenses.openAddForm();
    await expenses.addExpense('Coffee shop test', '8.50', 'Food');

    // The form should close and the new row should appear
    // Table row count must have grown by exactly 1
    await expect(expenses.tableRows).toHaveCount(initialCount + 1);

    // The description text must be visible in the table
    await expect(page.getByRole('cell', { name: 'Coffee shop test' })).toBeVisible();
  });

  // Test 4 — Searching filters the transaction list to matching rows only
  // Verifies that typing in the search box removes non-matching rows from the table.
  test('searching by description text shows only matching transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Search for a term that is guaranteed to match some seeded transactions
    await expenses.search('Rent payment');

    // Every visible row description cell must contain the search term
    const descriptionCells = page.locator('tbody tr td:nth-child(2)');
    const count = await descriptionCells.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const text = await descriptionCells.nth(i).textContent();
      expect(text?.toLowerCase()).toContain('rent payment');
    }
  });

});

test.describe('Settings — save profile changes', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Settings tab
    await new PageFactory(page).settings().navigate();
  });

  // Test 5 — Saving a new name persists it in the profile section
  // Verifies the UPDATE_PROFILE action updates the displayed name immediately.
  test('saving profile changes reflects the new name in the settings page', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    const newName = 'Test User QA';

    // Fill in a new name and save
    await settings.saveProfile(newName, 'testqa@wealthpulse.demo', 'USD');

    // The save button must briefly show "✓ Saved!" confirming the action fired
    await expect(settings.savedConfirmation).toBeVisible();

    // The avatar initials derived from the new name must appear in the card header
    // "Test User QA" → initials "TU"
    await expect(
      page.locator('div.w-16.h-16').filter({ hasText: 'TU' })
    ).toBeVisible();

    // The name must also appear in the profile text below the avatar
    await expect(page.getByText(newName)).toBeVisible();
  });

});
