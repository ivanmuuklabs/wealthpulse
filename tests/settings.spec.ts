import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings / Profile — Happy Path & Negative Tests
 *
 * User story: "As a logged-in user I can update my profile name, email,
 * and display currency, and toggle notification preferences so that my
 * account reflects my real identity and I receive the alerts I need."
 *
 * Acceptance criteria (happy path):
 * - Settings page is reachable via the sidebar and the top-bar avatar
 * - Form pre-fills with the demo defaults (Alex Morgan / alex@wealthpulse.demo / USD)
 * - Saving shows a "✓ Saved!" confirmation button
 * - Saving a new name reflects in the in-card profile display and avatar initials
 * - Currency selector accepts EUR and GBP
 * - Preference toggles (Dark Mode, Email Notifications, Monthly Reports) are interactive
 *
 * Negative / edge cases:
 * - Saving with an empty name does not crash the app
 * - The "✓ Saved!" confirmation auto-dismisses after ~2 s
 * - Navigating away without saving discards unsaved changes
 * - Very long names are accepted without layout breaking
 */

test.describe('Settings / Profile — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const settings = factory.settings();
    await settings.navigate();
    await expect(settings.heading).toBeVisible();
  });

  test('Settings form pre-fills with demo defaults', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await expect(settings.nameInput).toHaveValue('Alex Morgan');
    await expect(settings.emailInput).toHaveValue('alex@wealthpulse.demo');
    await expect(settings.currencySelect).toHaveValue('USD');
  });

  test('clicking Save Changes shows the "✓ Saved!" confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.saveButton.click();

    await expect(settings.savedConfirmation).toBeVisible();
  });

  test('saving a new name updates the profile card display name', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateProfile('Jordan Lee');

    // The profile card should now show the new name
    await expect(settings.profileCardName).toHaveText('Jordan Lee');
  });

  test('saving a new name updates the avatar initials in the profile card', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateProfile('Jordan Lee');

    // "Jordan Lee" → initials "JL"
    const initials = await settings.getAvatarInitials();
    expect(initials?.trim()).toBe('JL');
  });

  test('Settings page is reachable via the top-bar avatar button', async ({ page }) => {
    // Start from Dashboard (logged in, beforeEach already navigated to Settings)
    // Navigate away first
    const factory = new PageFactory(page);
    await factory.dashboard().navigate();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Then use the top-bar avatar to get back to Settings
    const settings = factory.settings();
    await settings.navigateViaTopBarAvatar();

    await expect(settings.heading).toBeVisible();
  });

  test('currency can be changed to EUR and is retained after save', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateProfile(undefined, undefined, 'EUR');

    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  test('currency can be changed to GBP and is retained after save', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateProfile(undefined, undefined, 'GBP');

    await expect(settings.currencySelect).toHaveValue('GBP');
  });

  test('all 3 preference toggles are visible and clickable', async ({ page }) => {
    // The preference section renders 3 labelled toggle rows
    const toggles = page.locator('label').filter({ hasText: /dark mode|email notifications|monthly reports/i });

    await expect(toggles).toHaveCount(3);

    // Each toggle should be clickable (no errors thrown)
    for (let i = 0; i < 3; i++) {
      await toggles.nth(i).click();
    }
  });
});

test.describe('Settings / Profile — negative / edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const settings = factory.settings();
    await settings.navigate();
    await expect(settings.heading).toBeVisible();
  });

  test('saving with an empty name does not crash — app stays on Settings', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.nameInput.clear();
    await settings.saveButton.click();

    // The page must remain stable — Settings heading still visible
    await expect(settings.heading).toBeVisible();
  });

  test('"✓ Saved!" confirmation auto-dismisses after ~2 seconds', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.saveButton.click();
    await expect(settings.savedConfirmation).toBeVisible();

    // App dismisses the confirmation after 2 s; allow 3 s tolerance
    await expect(settings.savedConfirmation).not.toBeVisible({ timeout: 3000 });
    // Save button text should revert to "Save Changes"
    await expect(settings.saveButton).toBeVisible();
  });

  test('navigating away without saving discards unsaved changes', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Type a new name but do NOT click Save
    await settings.nameInput.clear();
    await settings.nameInput.fill('Unsaved Name');

    // Navigate away to Dashboard
    const dashboard = new PageFactory(page).dashboard();
    await dashboard.navigate();
    await expect(dashboard.overviewHeading).toBeVisible();

    // Come back to Settings — name should be back to the original default
    await settings.navigate();
    await expect(settings.nameInput).toHaveValue('Alex Morgan');
  });

  test('a very long name is accepted without layout breaking', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    const longName = 'A'.repeat(80);
    await settings.updateProfile(longName);

    // Settings page must remain visible — no crash or routing away
    await expect(settings.heading).toBeVisible();
    await expect(settings.savedConfirmation).toBeVisible();
  });
});
