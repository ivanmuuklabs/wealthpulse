import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests for the Settings tab.
 *
 * Coverage gap addressed: the Settings module (profile editing and save
 * confirmation) was completely untested. This spec verifies that:
 *  1. Updating the user's name and clicking Save shows the "✓ Saved!" confirmation.
 *  2. The top-bar avatar initials update to reflect the new name.
 *
 * Both flows exercise the UPDATE_PROFILE reducer action.
 */

test.describe('Settings — save profile changes', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to Settings via the sidebar
    await new PageFactory(page).settings().navigate();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  // ─── Test 5: Save Profile ────────────────────────────────────────────────
  test('saving profile changes shows the saved confirmation and reflects the new name', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // The default demo name is "Alex Morgan" — change it to a distinct value
    const newName = 'Jordan Rivera';
    await settings.setName(newName);

    // Click Save Changes
    await settings.save();

    // The button text must change to "✓ Saved!" immediately after saving
    await expect(page.getByRole('button', { name: /saved!/i })).toBeVisible();

    // The profile card preview should reflect the new name
    await expect(page.getByText(newName).first()).toBeVisible();

    // The avatar initials in the profile card should update to "JR"
    // (the avatar shows the first letter of each word in the name)
    const avatarInSettings = page
      .locator('div.rounded-2xl', { hasText: /^[A-Z]{2}$/ })
      .first();
    await expect(avatarInSettings).toHaveText('JR');
  });
});
