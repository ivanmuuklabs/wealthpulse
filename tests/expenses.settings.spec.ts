import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses — add expense flow  (Test 4)
 * Settings  — save profile flow (Test 5)
 *
 * These two modules had zero test coverage. These tests target their
 * highest-impact, happy-path user flows.
 */

// ── Test 4 ──────────────────────────────────────────────────────────────────
// Adding a new expense via the form and verifying it appears in the table.
// This covers the "Add Expense" button, the form inputs, and the Save action —
// none of which had any test coverage before.
test.describe('Expenses — add expense form', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Navigate to the Expenses tab
    await new PageFactory(page).expenses().navigate();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  test('adding a new expense via the form inserts it into the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Open the Add Expense form
    await expenses.openAddForm();

    // The description input must appear inside the form
    await expect(expenses.descriptionInput).toBeVisible();

    // Fill in the new expense details
    const description = 'Test Automation Coffee';
    const amount = '12.50';
    await expenses.addExpense(description, amount);

    // After saving, the form should close (description input disappears)
    await expect(expenses.descriptionInput).not.toBeVisible();

    // The new expense must now appear somewhere in the transaction table.
    // We search for it explicitly to isolate it from other rows.
    await expenses.search(description);
    await expect(page.getByRole('cell', { name: description })).toBeVisible();

    // The amount must be formatted and shown as a negative (expense)
    await expect(page.getByText('-$12.50')).toBeVisible();
  });
});

// ── Test 5 ──────────────────────────────────────────────────────────────────
// Saving profile information and confirming the UI acknowledges it.
// This covers the Settings → Profile → Save Changes flow entirely for the first time.
test.describe('Settings — save profile', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Navigate to the Settings tab
    await new PageFactory(page).settings().navigate();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('saving profile changes shows the "✓ Saved!" confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // The Full Name field should exist and be pre-filled with "Alex Morgan"
    await expect(settings.nameInput).toBeVisible();
    await expect(settings.nameInput).toHaveValue('Alex Morgan');

    // Update the name
    await settings.updateName('Alex Updated');

    // Click Save Changes
    await settings.save();

    // The button must briefly change to "✓ Saved!" to confirm success
    await expect(settings.savedConfirmation).toBeVisible();

    // The profile card above the form should reflect the new name
    await expect(page.getByText('Alex Updated').first()).toBeVisible();
  });
});
