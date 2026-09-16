import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Test 5 — Settings: save profile and toggle preferences
 *
 * Coverage gap: The Settings module has zero tests. Two critical interactions
 * are untested: (1) saving an updated profile name/email and seeing the
 * "✓ Saved!" confirmation, and (2) toggling a preference switch.
 */
test.describe('Settings — profile and preferences', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const settings = factory.settings();
    await settings.navigate();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('saving a new profile name shows the "✓ Saved!" confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Update the full name field
    await settings.nameInput.clear();
    await settings.nameInput.fill('Test User Updated');

    // Click Save Changes
    await settings.save();

    // The button text should briefly change to "✓ Saved!"
    await expect(settings.saveButton).toHaveText(/✓ Saved!/i);
  });

  test('toggling the Email Notifications preference switch changes its state', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Email Notifications is the second toggle (index 1); it starts OFF (bg-slate-700)
    const emailToggle = settings.preferenceToggles.nth(1);

    // Read initial state
    const initialClass = await emailToggle.getAttribute('class') ?? '';
    const wasOn = initialClass.includes('bg-emerald-500');

    // Click to toggle
    await emailToggle.click();

    // State must have flipped
    if (wasOn) {
      await expect(emailToggle).toHaveClass(/bg-slate-700/);
    } else {
      await expect(emailToggle).toHaveClass(/bg-emerald-500/);
    }
  });
});
