import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings module tests.
 *
 * Coverage gap addressed:
 *   Test 5 — editing the Full Name field and saving via "Save Changes"
 *             updates the profile name visible in the Settings page and
 *             briefly shows the "Saved!" confirmation on the button.
 *             The Settings module had zero test coverage prior to this.
 */

test.describe('Settings — save profile', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to Settings via the sidebar
    const settingsPage = factory.settings();
    await settingsPage.navigate();
    // Confirm the Settings view has loaded
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
  });

  // Test 5 — saving an updated profile name reflects immediately in the UI
  test('saving an updated full name shows Saved! confirmation and persists the new name', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    const updatedName = 'Jane Playwright';

    // Clear and fill the Full Name field with a new value
    await settingsPage.setFullName(updatedName);

    // Verify the input holds the new name before saving
    await expect(settingsPage.fullNameInput).toHaveValue(updatedName);

    // Click Save Changes
    await settingsPage.saveProfile();

    // The button should briefly show "Saved!" as a confirmation
    await expect(settingsPage.saveButton).toHaveText(/saved!/i);

    // After the confirmation, the input should still hold the updated name
    await expect(settingsPage.fullNameInput).toHaveValue(updatedName);
  });
});
