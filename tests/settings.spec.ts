import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests for the Settings section.
 *
 * Covers:
 *   5. Saving profile changes triggers the "Saved!" confirmation label
 *      on the button and updates the avatar initials in the profile summary.
 */

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to Settings
    const settings = factory.settings();
    await settings.navigate();

    // Confirm we are on the Settings page by checking for the Save Changes button
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
  });

  // ── Test 5 ──────────────────────────────────────────────────────────
  // Editing the full name and clicking "Save Changes" must:
  //   a) Switch the button label to "Saved!" (brief confirmation),
  //   b) Update the avatar initials in the profile card to reflect the new name.
  test('saving profile changes shows "Saved!" confirmation and updates avatar initials', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Clear the current name and enter a new one with known initials (JD → "JD")
    await settings.fullNameInput.clear();
    await settings.fullNameInput.fill('Jane Doe');

    // Submit the profile form
    await settings.saveProfile();

    // The button label must transition to "Saved!" within the timeout window
    await expect(settings.saveChangesButton).toHaveText(/saved!/i);

    // The avatar initials badge in the profile card must reflect the new name.
    // "Jane Doe" → initials "JD"
    await expect(settings.avatarBadge).toHaveText(/JD/i);
  });
});
