import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Test 5 — Settings: save profile
 *
 * Gap addressed: The Settings module is completely untested. It contains two
 * main interactive sections — Profile Information (name, email, currency) and
 * Preferences (toggle switches). Saving the profile is the highest-impact
 * action: if it regresses, users cannot update their account data. This test
 * covers the full write → confirm feedback loop for the profile form.
 *
 * Flow:
 *  1. Navigate to Settings.
 *  2. Update the Full Name field to a new value.
 *  3. Click Save Changes.
 *  4. Assert the button briefly shows "✓ Saved!" (the in-app confirmation).
 *  5. Assert the avatar initials in the profile card reflect the new name.
 */
test.describe('Settings — save profile', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
  });

  test('updating Full Name and saving shows the Saved confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    // The Settings heading should be visible
    await expect(settings.heading).toBeVisible();

    // Profile form inputs must be present
    await expect(settings.fullNameInput).toBeVisible();
    await expect(settings.emailInput).toBeVisible();
    await expect(settings.currencySelect).toBeVisible();

    // Change the name
    await settings.setFullName('Jamie Rivera');

    // Save
    await settings.saveChanges();

    // Confirmation feedback appears on the button (text changes to "✓ Saved!")
    await expect(settings.savedConfirmation).toBeVisible();

    // The avatar block in the profile card should now show the new initials "JR"
    // (the app derives initials from the saved name)
    await expect(page.getByText('JR')).toBeVisible();
  });

  test('toggling the Email Notifications preference changes its state', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    // Check the initial off state (Email Notifications defaults to false / off)
    const initiallyOn = await settings.isPreferenceOn('Email Notifications');
    expect(initiallyOn).toBe(false);

    // Toggle it on
    await settings.togglePreference('Email Notifications');

    const nowOn = await settings.isPreferenceOn('Email Notifications');
    expect(nowOn).toBe(true);

    // Toggle it back off
    await settings.togglePreference('Email Notifications');
    const finallyOn = await settings.isPreferenceOn('Email Notifications');
    expect(finallyOn).toBe(false);
  });
});
