import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings module tests.
 *
 * Coverage gaps addressed:
 *   5. Save profile — verifies that editing the Full Name field and clicking
 *      "Save Changes" shows the "✓ Saved!" confirmation and reflects the new
 *      name in the avatar initials displayed on the page.
 */

test.describe('Settings — save profile', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    const settings = factory.settings();
    await settings.navigate();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  // Test 5 of 5 — updating profile name shows confirmation and updates initials
  test('saving an updated name shows the Saved confirmation message', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Update the full name to a new value
    await settings.saveProfile({ name: 'Jordan Rivera' });

    // The "✓ Saved!" confirmation must appear immediately
    await expect(settings.savedConfirmation).toBeVisible();

    // The avatar initials should now reflect "JR" (first letters of each word)
    // The avatar is rendered in both the sidebar card area and the top-bar button
    await expect(page.getByText('JR').first()).toBeVisible();

    // After ~2 s the button text reverts to "Save Changes" — the confirmation
    // is transient so we just verify the page is still on Settings
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });
});
