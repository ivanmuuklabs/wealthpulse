import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings Tab — tests
 *
 * Flows covered:
 *   - Settings tab loads and profile form is pre-populated with demo defaults.
 *   - Saving a profile change shows "✓ Saved!" confirmation.
 *   - Updated name reflects in the profile card and avatar initials.
 *   - Currency selector persists the chosen value.
 *   - Email Notifications toggle flips its visual state.
 *   - Settings is reachable via the top-bar avatar button.
 *   - Saving with an empty name does not crash the app.
 *   - Saving a blank email does not crash the app.
 *   - Navigating away without saving discards the unsaved value.
 *
 * Added by Amikoo QA worker Test-new-pull-requests — 2026-09-16
 */

test.describe('Settings — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  test('settings tab loads with the Profile Information heading visible', async ({ page }) => {
    await expect(page.getByText('Profile Information')).toBeVisible();
  });

  test('profile form is pre-populated with demo user defaults', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Demo user: Alex Morgan / alex@wealthpulse.demo / USD
    await expect(settings.nameInput).toHaveValue('Alex Morgan');
    await expect(settings.emailInput).toHaveValue('alex@wealthpulse.demo');
    await expect(settings.currencySelect).toHaveValue('USD');
  });

  test('saving a profile change shows the "✓ Saved!" confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.setName('QA Tester');
    await settings.save();

    // The button text changes to "✓ Saved!" momentarily
    await expect(settings.savedConfirmation).toBeVisible();
  });

  test('updated name is reflected in the profile card display', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.setName('Jane Doe');
    await settings.save();

    // The profile card <p> below the avatar should show the new name
    const profileCard = page
      .locator('.rounded-2xl')
      .filter({ hasText: 'Profile Information' });
    await expect(profileCard).toContainText('Jane Doe');
  });

  test('updated name updates the avatar initials in the profile card', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.setName('Tom Rivera');
    await settings.save();

    // Avatar initials are the first letters of each word: "TR"
    const avatarDiv = page
      .locator('.rounded-2xl')
      .filter({ hasText: 'Profile Information' })
      .locator('div.rounded-2xl')
      .first();
    await expect(avatarDiv).toContainText('TR');
  });

  test('changing currency to EUR persists the selection', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.setCurrency('EUR');
    await settings.save();

    // After save the dropdown value should still be EUR
    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  test('Email Notifications toggle changes its visual state when clicked', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    const toggle = settings.emailNotificationsToggle;

    // Read the initial class (off state = bg-slate-700)
    const initialClass = await toggle.getAttribute('class');

    await toggle.click();

    const newClass = await toggle.getAttribute('class');
    // The background class must have changed
    expect(newClass).not.toEqual(initialClass);
  });

  test('Settings is reachable via the top-bar avatar button', async ({ page }) => {
    const factory = new PageFactory(page);

    // Navigate away from Settings first
    await factory.expenses().navigate();
    await expect(page.getByText('Profile Information')).not.toBeVisible();

    // Click the top-bar avatar
    await factory.settings().navigateViaTopBarAvatar();

    await expect(page.getByText('Profile Information')).toBeVisible();
  });
});

test.describe('Settings — negative & edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  test('saving with an empty name does not crash the app', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.setName('');
    await settings.save();

    // Page must remain stable — Settings heading still visible
    await expect(page.getByText('Profile Information')).toBeVisible();
  });

  test('saving a malformed email does not crash the app', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.setEmail('not-a-valid-email');
    await settings.save();

    // React stores the value without crashing (no client-side email guard)
    await expect(page.getByText('Profile Information')).toBeVisible();
  });

  test('navigating away without saving discards the unsaved name change', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Change the name but do NOT save
    await settings.setName('Unsaved Ghost');

    // Navigate to Expenses and back
    await new PageFactory(page).expenses().navigate();
    await settings.navigate();

    // The input should revert to "Alex Morgan"
    await expect(settings.nameInput).toHaveValue('Alex Morgan');
  });

  test('Dark Mode toggle changes its visual state when clicked', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    const toggle = settings.darkModeToggle;
    const before = await toggle.getAttribute('class');

    await toggle.click();

    const after = await toggle.getAttribute('class');
    // Toggle must have toggled (background class changes)
    expect(after).not.toEqual(before);

    // Page must remain stable
    await expect(page.getByText('Profile Information')).toBeVisible();
  });
});
