import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings tab tests.
 *
 * Coverage gap addressed:
 *   - Test 5: Saving profile changes via the Settings form and confirming the
 *     success feedback — the Settings module had zero test coverage before this PR.
 */

test.describe('Settings — save profile', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await new PageFactory(page).settings().navigate();
  });

  /**
   * Test 5 — Saving a new profile name shows the "✓ Saved!" confirmation.
   *
   * Covers: Settings tab navigation → Full Name input → Save Changes button →
   * transient ✓ Saved! confirmation → updated name reflected in the avatar
   * initials area.
   *
   * The UPDATE_PROFILE reducer is exercised end-to-end: the input change,
   * the dispatch, and the resulting UI feedback are all verified.
   */
  test('saving a new profile name shows the Saved confirmation and updates the display', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Update the Full Name field with a new value
    await settings.fullNameInput.clear();
    await settings.fullNameInput.fill('Jane Doe');

    // Click Save Changes
    await settings.saveButton.click();

    // The button must transiently show "✓ Saved!" to confirm the dispatch fired
    await expect(settings.savedConfirmation).toBeVisible();

    // The profile card name preview inside the Settings card must update
    // (rendered as a plain <p> element next to the avatar initials)
    await expect(page.getByText('Jane Doe').first()).toBeVisible();

    // The avatar initials area must now reflect "JD"
    // (the app computes initials as first letters of each word in the name)
    const avatarInitials = page
      .locator('div.bg-gradient-to-br.from-emerald-500')
      .filter({ hasText: /^[A-Z]{1,2}$/ })
      .first();
    await expect(avatarInitials).toContainText('JD');
  });
});
