import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings Tab tests
 * ==================
 * User story: "As a user I want to update my profile (name, email, currency)
 * in the Settings section so that my account information is always current."
 *
 * Acceptance criteria inferred from the app's Settings tab:
 *  - Happy Path:
 *    AC1. Navigating to Settings shows the profile form pre-filled with current values.
 *    AC2. Updating the display name and saving shows the "Saved!" confirmation.
 *    AC3. Updating the email and saving shows the "Saved!" confirmation.
 *    AC4. Changing the currency preference and saving persists the selection.
 *  - Negative Path:
 *    AC5. Clearing the name field and saving still triggers the save action
 *         (the app accepts an empty name — guard against a silent crash).
 *    AC6. Entering a malformed email and saving still triggers the save action
 *         (client-side: no crash, confirmation is shown).
 */

test.describe('Settings — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to Settings
    const settingsPage = factory.settings();
    await settingsPage.navigate();
  });

  // AC1 — Settings form is pre-populated with the demo user's values
  test('Settings tab shows the profile form pre-filled with current user data', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    // Name field should contain the seeded user's name
    await expect(settingsPage.nameInput).toHaveValue('Alex Morgan');

    // Email field should contain the seeded email
    await expect(settingsPage.emailInput).toHaveValue('alex@wealthpulse.demo');

    // The Save button must be visible and enabled
    await expect(settingsPage.saveButton).toBeVisible();
    await expect(settingsPage.saveButton).toBeEnabled();
  });

  // AC2 — Updating the display name persists and shows confirmation
  test('updating the display name and saving shows the Saved! confirmation', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.updateName('Jordan Rivera');
    await settingsPage.save();

    // Brief "Saved!" indicator must appear
    await expect(settingsPage.savedConfirmation).toBeVisible();

    // After the toast disappears (2 s timeout in app), the input keeps the new value
    await expect(settingsPage.nameInput).toHaveValue('Jordan Rivera');
  });

  // AC3 — Updating the email and saving shows confirmation
  test('updating the email and saving shows the Saved! confirmation', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.updateEmail('jordan@example.com');
    await settingsPage.save();

    await expect(settingsPage.savedConfirmation).toBeVisible();
    await expect(settingsPage.emailInput).toHaveValue('jordan@example.com');
  });

  // AC4 — Currency selection is persisted after save
  test('changing currency preference and saving persists the new selection', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.updateCurrency('EUR');
    await settingsPage.save();

    await expect(settingsPage.savedConfirmation).toBeVisible();

    // Reload the settings page (still within the SPA) and verify the selection sticks
    await settingsPage.navigate();
    await expect(settingsPage.currencySelect).toHaveValue('EUR');
  });
});

test.describe('Settings — negative path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const settingsPage = factory.settings();
    await settingsPage.navigate();
  });

  // AC5 — Saving with an empty name must not crash the app
  test('saving with an empty name field does not crash and shows confirmation', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    // Clear the name entirely
    await settingsPage.updateName('');
    await settingsPage.save();

    // The app should show a confirmation (or at least not crash)
    await expect(settingsPage.savedConfirmation).toBeVisible();

    // The page must still be functional after saving an empty name
    await expect(settingsPage.saveButton).toBeVisible();
  });

  // AC6 — Saving with a malformed email must not crash the app
  test('saving with a malformed email address does not crash and shows confirmation', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    // Provide a clearly malformed email (no domain)
    await settingsPage.updateEmail('not-an-email');
    await settingsPage.save();

    // The app accepts it client-side (no server validation in this demo app)
    await expect(settingsPage.savedConfirmation).toBeVisible();

    // The app remains on the Settings page and is functional
    await expect(settingsPage.saveButton).toBeVisible();
  });
});
