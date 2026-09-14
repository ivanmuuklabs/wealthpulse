import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings Tab Tests
 *
 * Covers the user story: "As a user I can update my profile name, email,
 * and currency, and toggle notification preferences on the Settings tab."
 *
 * Based on the Settings feature shipped as part of the WealthPulse v1 release.
 */

test.describe('Settings — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
  });

  test('Settings tab loads with pre-populated profile information', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    // Heading confirms correct tab
    await expect(settings.heading).toBeVisible();

    // Default seeded values are present in the form
    await expect(settings.nameInput).toHaveValue('Alex Morgan');
    await expect(settings.emailInput).toHaveValue('alex@wealthpulse.demo');

    // Save button is visible (not yet in "Saved!" state)
    await expect(settings.saveButton).toBeVisible();
  });

  test('updating the profile name and saving shows the success confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    // Update the name field and save
    await settings.updateProfile('Jordan Rivera', 'jordan@wealthpulse.demo');

    // The button text briefly changes to "✓ Saved!"
    await expect(settings.savedConfirmation).toBeVisible();
  });

  test('updated name is reflected in the avatar initials', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    // Set a known name so initials are predictable (first letter of each word)
    await settings.updateProfile('Casey Quinn', 'casey@wealthpulse.demo');

    // Avatar should show "CQ"
    await expect(settings.avatarInitials).toContainText('CQ');
  });

  test('changing currency to EUR and saving persists the selection', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    await settings.updateProfile('Alex Morgan', 'alex@wealthpulse.demo', 'EUR');

    // Confirmation fires
    await expect(settings.savedConfirmation).toBeVisible();

    // Currency select now shows EUR as the selected value
    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  test('toggling Email Notifications preference changes its visual state', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    // Email Notifications starts OFF (defaultOn=false in the source)
    const toggle = settings.emailNotificationsToggle;
    const offClass = await toggle.getAttribute('class');

    // Click to enable
    await toggle.click();
    const onClass = await toggle.getAttribute('class');

    // The background class should differ between on and off states
    expect(offClass).not.toEqual(onClass);
  });

  test('top-bar avatar button navigates to Settings tab', async ({ page }) => {
    const factory = new PageFactory(page);
    const loginPage = factory.login();
    await loginPage.goto();
    await loginPage.loginAsDemo();

    // Click the avatar initials button in the top bar (not in Settings yet)
    await page.locator('header button').filter({ hasText: /^[A-Z]{1,2}$/ }).click();

    // Should land on Settings
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });
});

test.describe('Settings — negative path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    const settings = factory.settings();
    await settings.navigate();
  });

  test('clearing the name field and saving reflects empty name in avatar', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Clear the name (edge case: empty string)
    await settings.nameInput.clear();
    await settings.saveButton.click();

    // Confirmation still fires (app does not block empty save)
    await expect(settings.savedConfirmation).toBeVisible();

    // Avatar initials area exists but shows empty / no initials
    await expect(settings.avatarInitials).toBeVisible();
    // The avatar text should be empty (no chars to derive initials from)
    await expect(settings.avatarInitials).toHaveText('');
  });

  test('submitting an invalid email format still saves (client-side validation is minimal)', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // The app uses a plain text input for email — HTML5 type="email" validation
    // is the only guard; the Save button itself does not block invalid values.
    await settings.emailInput.clear();
    await settings.emailInput.fill('not-an-email');
    await settings.saveButton.click();

    // App saves without a blocking error (by design — demo app)
    await expect(settings.savedConfirmation).toBeVisible();
  });

  test('toggling Dark Mode does not navigate away from Settings', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.darkModeToggle.click();

    // Still on Settings tab after interacting with the toggle
    await expect(settings.heading).toBeVisible();
  });

  test('Saved! confirmation disappears automatically after ~2 seconds', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Trigger save
    await settings.saveButton.click();
    await expect(settings.savedConfirmation).toBeVisible();

    // After the 2-second timeout the button reverts to "Save Changes"
    await expect(settings.saveButton).toBeVisible({ timeout: 4000 });
  });
});
