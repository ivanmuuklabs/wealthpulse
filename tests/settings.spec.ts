import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Settings module
    const settingsPage = factory.settings();
    await settingsPage.navigate();

    // Confirm the Settings view is loaded
    await expect(page.getByText('Profile Information')).toBeVisible();
  });

  // Test 4 — Saving a new name updates the avatar initials in the header
  test('saving a new profile name updates the avatar initials in the header', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    // Change the full name to a deterministic value with known initials
    await settingsPage.editProfile({ name: 'Quinn Taylor' });
    await settingsPage.saveProfile();

    // The button should briefly show "Saved!" to confirm the action succeeded
    await expect(settingsPage.savedConfirmation).toBeVisible();

    // After the confirmation fades, the button reverts to "Save Changes"
    await expect(settingsPage.saveButton).toBeVisible();

    // The header avatar badge must now show the initials of the new name ("QT")
    await expect(
      page.locator('header').getByText('QT')
    ).toBeVisible();
  });

  // Test 5 — Toggling a preference switch changes its visual state
  test('toggling Email Notifications changes the toggle visual state', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    const toggle = settingsPage.emailNotificationsToggle;

    // Capture the initial checked state
    const initialChecked = await toggle.isChecked();

    // Click the toggle to flip it
    await toggle.click();

    // The state must have changed
    const newChecked = await toggle.isChecked();
    expect(newChecked).not.toEqual(initialChecked);
  });
});
