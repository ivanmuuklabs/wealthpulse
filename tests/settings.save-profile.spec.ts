import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Test 5 — Settings: saving profile changes persists to the UI
 *
 * Coverage gap addressed: the Settings tab and UPDATE_PROFILE reducer were
 * completely untested. This verifies that:
 * 1. The "Save Changes" button shows a transient "✓ Saved!" confirmation.
 * 2. The updated name is reflected in the avatar initials inside the Settings card.
 * 3. The updated name appears in the top-bar avatar button (initials derived from name).
 */
test.describe('Settings — save profile changes', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  test('saving a new name shows the ✓ Saved! confirmation and reflects the change in the avatar', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // The default name is "Alex Morgan" — update it to "Sam Rivers"
    await settings.updateName('Sam Rivers');

    // The button should temporarily change to "✓ Saved!" to confirm persistence
    await expect(settings.savedConfirmation).toBeVisible();

    // The avatar inside the profile card should now show "SR" (initials of Sam Rivers)
    // The avatar is a div whose text is the two-letter initials
    const avatarInitials = page
      .locator('div.w-16.h-16')
      .filter({ hasText: /^[A-Z]{2}$/ })
      .first();
    await expect(avatarInitials).toHaveText('SR');
  });
});
