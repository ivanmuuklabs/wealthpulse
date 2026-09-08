import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings tab — critical flow tests.
 *
 * Covers:
 *   Test 5 — Updating the Full Name field and clicking "Save Changes" shows
 *             the "✓ Saved!" confirmation feedback and persists the new name
 *             in the profile avatar area.
 *
 * The Settings tab was completely uncovered: no existing test exercises
 * profile editing or the Save Changes flow.
 */

test.describe('Settings tab — save profile', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await new PageFactory(page).settings().navigate();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  // Test 5 — Saving a profile change shows the transient "✓ Saved!" confirmation
  test('saving a profile name change shows the "✓ Saved!" confirmation and updates the avatar initials', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Update the full name to a new value
    const newName = 'Jordan Test';
    await settings.fullNameInput.clear();
    await settings.fullNameInput.fill(newName);

    // Click Save Changes
    await settings.saveButton.click();

    // The button text must immediately change to "✓ Saved!" (transient, 2 s)
    await expect(settings.savedConfirmation).toBeVisible();

    // The avatar area should now show the updated initials "JT"
    const avatar = page.locator('div').filter({ hasText: /^JT$/ }).first();
    await expect(avatar).toBeVisible();

    // The name text should also be updated in the profile info block
    await expect(page.getByText(newName).first()).toBeVisible();
  });
});
