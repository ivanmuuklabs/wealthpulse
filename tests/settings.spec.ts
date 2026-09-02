import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings — critical flow not yet covered by any existing test.
 *
 * Test 5: Editing the profile name and clicking "Save Changes" shows a
 *         brief "✓ Saved!" confirmation on the button, and the avatar
 *         initials + profile summary update to reflect the new name.
 */

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Navigate to Settings
    const settings = factory.settings();
    await settings.navigate();
  });

  // Test 5 — Save profile shows confirmation and updates displayed name
  test('saving a new profile name shows the Saved! confirmation and updates the profile display', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    const newName = 'Jordan Lee';

    // Edit the Full Name field
    await settings.fullNameInput.fill(newName);

    // Click Save Changes
    await settings.saveButton.click();

    // The button should briefly show "✓ Saved!" confirming the save
    await expect(page.getByRole('button', { name: '✓ Saved!' })).toBeVisible();

    // The profile summary name (above the form) should update immediately
    // (the avatar section renders the current `name` state value)
    await expect(settings.profileNameDisplay).toHaveText(newName);

    // The avatar initials tile should reflect the initials of the new name ("JL")
    await expect(settings.profileAvatarInitials).toContainText('JL');

    // After ~2 seconds the button reverts to "Save Changes"
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible({ timeout: 5000 });
  });
});
