import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings tab — save profile flow
 *
 * Covers the previously untested flow of editing profile information
 * (Full Name, Email, Currency) and persisting it via "Save Changes".
 * After saving, the UI must display the confirmation feedback and
 * reflect the new name in the avatar initials.
 */

test.describe('Settings — save profile', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to Settings before each test
    await new PageFactory(page).settings().navigate();
  });

  // Test 5 — editing profile fields and saving shows the confirmation feedback
  test('saving updated profile information shows the saved confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Update the Full Name
    await settings.updateName('Jordan Test');

    // Update the Email
    await settings.updateEmail('jordan@test.example');

    // Change currency to EUR
    await settings.selectCurrency('EUR');

    // Click Save Changes
    await settings.save();

    // The button should temporarily read "✓ Saved!" to confirm persistence
    await expect(settings.savedConfirmation).toBeVisible();

    // Avatar initials in the profile card should reflect the new first+last initials
    // "Jordan Test" → "JT"
    await expect(page.locator('div.w-16.h-16').filter({ hasText: 'JT' })).toBeVisible();

    // The profile sub-heading below the avatar should show the updated email
    await expect(page.getByText('jordan@test.example')).toBeVisible();
  });
});
