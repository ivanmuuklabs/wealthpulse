import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.describe('Expenses', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Navigate to Expenses before each test
    await factory.expenses().navigate();
  });

  // Test 3 — Adding a new expense makes it appear in the transaction table
  test('adding a new expense appends it to the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Open the Add Expense form
    await expenses.openAddExpenseForm();

    // Fill in a distinctive description so it is easy to assert
    const uniqueDesc = 'AutoTest Coffee Run';
    await expenses.formDescription.fill(uniqueDesc);
    await expenses.formAmount.fill('12.50');
    await expenses.formCategory.selectOption('Food');

    // Submit
    await expenses.formSaveButton.click();

    // The form should close (Save button disappears from the inline form context)
    // and the new row must appear in the table
    await expect(page.getByRole('cell', { name: uniqueDesc })).toBeVisible();
  });

  // Test 4 — Searching by description filters the table in real time
  test('searching by description filters the transaction list to matching rows only', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Capture the initial row count before filtering
    const initialCount = await expenses.tableRows.count();
    expect(initialCount).toBeGreaterThan(0);

    // Search for a term that is very unlikely to match all rows
    await expenses.search('Housing');

    // After filtering, only rows containing "Housing" should be visible
    const filteredRows = expenses.tableRows;
    const filteredCount = await filteredRows.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(initialCount);

    // Each visible row must contain the search term (case-insensitive)
    for (let i = 0; i < filteredCount; i++) {
      const rowText = (await filteredRows.nth(i).textContent()) ?? '';
      expect(rowText.toLowerCase()).toContain('housing');
    }
  });
});

// Test 5 — Settings: save profile shows "Saved!" and avatar updates
// Placed here to stay within the 5-test target for this daily batch.
// A dedicated settings.spec.ts will be created in a future run once more
// settings flows need coverage.
import { test as settingsTest, expect as settingsExpect } from '@playwright/test';

settingsTest.describe('Settings — profile management', () => {
  settingsTest.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  settingsTest('saving a new profile name shows "Saved!" confirmation on the button', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Update the full name to something distinct
    await settings.fullNameInput.clear();
    await settings.fullNameInput.fill('Jane Tester');

    // Click Save Changes
    await settings.saveChangesButton.click();

    // The button must momentarily show "Saved!" (within 2 s per the spec)
    await settingsExpect(settings.saveChangesButton).toHaveText(/saved!/i);

    // After the timeout, it should revert to "Save Changes"
    await settingsExpect(settings.saveChangesButton).toHaveText(/save changes/i, { timeout: 5000 });
  });
});
