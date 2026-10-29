import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings module tests — covers one previously untested critical flow:
 *  1. Edit and Save Profile: updating the Full Name and clicking "Save Changes"
 *     shows the "Saved!" confirmation and updates the avatar initials.
 */
test.describe('Settings — edit and save profile', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
  });

  /**
   * Test 5 — Saving a new profile name shows "Saved!" confirmation and updates the avatar.
   *
   * Per the app spec: after clicking "Save Changes" the button label changes to "Saved!"
   * for 2 seconds, and the avatar initials in the header reflect the new name.
   */
  test('saving a new profile name shows "Saved!" confirmation and updates avatar initials', async ({ page }) => {
    const factory = new PageFactory(page);
    const settings = factory.settings();

    await settings.navigate();

    // Verify we are on the Settings page
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();

    // Change the name to something with distinct initials
    const newName = 'Quinn Rivera';
    await settings.saveProfile(newName);

    // The button must immediately show "Saved!" as confirmation
    await expect(settings.saveButton).toHaveText(/saved!/i);

    // After 2 s the button reverts to "Save Changes" — wait and re-check
    await expect(settings.saveButton).toHaveText(/save changes/i, { timeout: 5000 });

    // The header avatar (derived from initials) should now show "QR"
    // The avatar is rendered as a button/element containing the initials text
    await expect(page.getByText('QR').first()).toBeVisible();
  });

});
