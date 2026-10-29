import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Settings tab.
 *
 * User story: As a user I can update my profile information and toggle
 * notification preferences so that the app reflects my personal details.
 *
 * Acceptance criteria (derived from the app's SettingsTab component):
 *  1. Settings page renders with the current profile data pre-filled.
 *  2. Updating the name and saving shows "✓ Saved!" confirmation.
 *  3. The avatar initials update to reflect the new name after saving.
 *  4. Changing the currency dropdown and saving persists the selection.
 *  5. Toggling the Email Notifications switch changes its visual state.
 *  6. The Monthly Reports toggle is on by default and can be turned off.
 */

test.describe('Settings — happy path', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.settings().navigate();
  });

  // AC 1 — Settings tab renders with pre-filled profile data
  test('Settings tab loads and shows the profile form pre-filled', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await expect(settings.heading).toBeVisible();

    // Default profile values from seed data
    await expect(settings.nameInput).toHaveValue('Alex Morgan');
    await expect(settings.emailInput).toHaveValue('alex@wealthpulse.demo');
    await expect(settings.currencySelect).toHaveValue('USD');
  });

  // AC 2 — Updating name shows "✓ Saved!" confirmation
  test('updating the full name and saving shows the saved confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.nameInput.fill('Jordan Smith');
    await settings.saveButton.click();

    // The button text changes to "✓ Saved!" for ~2 seconds
    await expect(settings.savedConfirmation).toBeVisible();
  });

  // AC 3 — Avatar initials update after saving a new name
  test('avatar initials update to reflect the new saved name', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.nameInput.fill('Chris Doe');
    await settings.saveButton.click();
    await expect(settings.savedConfirmation).toBeVisible();

    // Initials should be "CD" (first letters of each word)
    await expect(settings.avatarInitials).toContainText('CD');
  });

  // AC 4 — Changing currency and saving persists the selection
  test('changing currency to EUR and saving persists the selection', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.currencySelect.selectOption('EUR');
    await settings.saveButton.click();
    await expect(settings.savedConfirmation).toBeVisible();

    // After the confirmation fades the dropdown must still show EUR
    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  // AC 5 — Email Notifications toggle flips its visual state
  test('clicking Email Notifications toggle changes its visual state', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Default is OFF for Email Notifications → background should be slate (not emerald)
    const toggle = settings.emailNotificationsToggle;
    await expect(toggle).toHaveClass(/bg-slate-700/);

    // Click to enable
    await toggle.click();
    await expect(toggle).toHaveClass(/bg-emerald-500/);
  });

  // AC 6 — Monthly Reports is on by default and can be turned off
  test('Monthly Reports toggle is on by default and can be toggled off', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Default is ON → emerald background
    const toggle = settings.monthlyReportsToggle;
    await expect(toggle).toHaveClass(/bg-emerald-500/);

    // Click to disable
    await toggle.click();
    await expect(toggle).toHaveClass(/bg-slate-700/);
  });

  // Navigating away and back preserves saved values within the session
  test('saved profile values persist when navigating away and back to Settings', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Save a new name
    await settings.nameInput.fill('Morgan Lee');
    await settings.saveButton.click();
    await expect(settings.savedConfirmation).toBeVisible();

    // Navigate away to Dashboard
    await page.getByRole('button', { name: /charts/i }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Return to Settings
    await settings.navigate();

    // The previously saved name must still be there (React state persists within session)
    await expect(settings.nameInput).toHaveValue('Morgan Lee');
  });
});
