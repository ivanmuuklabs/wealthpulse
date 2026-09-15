import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings tab — coverage tests added 2026-09-15
 *
 * Gap addressed:
 *  5. Saving the profile form shows a "✓ Saved!" confirmation and persists the new name.
 */

test.describe('Settings — profile save', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const settings = factory.settings();
    await settings.navigate();
  });

  // Test 5 — Saving profile with a new name shows confirmation and updates the avatar initials
  test('saving profile changes shows the "Saved!" confirmation and reflects the new name', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Update to a distinctive name
    await settings.saveProfile('Jordan Blake', 'jordan@wealthpulse.demo');

    // The button text should transition to "✓ Saved!" immediately after click
    await expect(settings.savedConfirmation).toBeVisible();

    // The avatar in the sidebar top bar should now reflect the new initials "JB"
    // (the avatar button shows the first letter of each name word, max 2 chars)
    await expect(page.getByRole('button', { name: 'JB' })).toBeVisible();
  });
});
