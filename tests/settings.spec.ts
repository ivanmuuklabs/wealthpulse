import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings Tab — Happy Path & Negative Tests
 *
 * User Story (WP-YY — derived from app feature analysis, 2026-09-17):
 *   "As a user I can update my profile information and preferences on the
 *    Settings tab so that the app reflects my personal details and choices."
 *
 * Acceptance criteria tested:
 *   ✅ Settings tab is accessible from the sidebar
 *   ✅ Profile form pre-fills with the current user data
 *   ✅ Saving a new name updates the profile card initials and confirmation
 *   ✅ Currency can be changed to EUR / GBP
 *   ✅ The "✓ Saved!" confirmation appears and auto-dismisses
 *   ✅ Email Notifications toggle changes state
 *   ✅ Empty name is still accepted by the form (no hard validation in app)
 *   ✅ An invalid email format can be typed (no hard validation in app)
 *   ✅ Navigating away and back preserves the saved name
 */

/** Log in and navigate to Settings before every test. */
test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await factory.settings().navigate();
});

/* ═══════════════════════════════════════
   HAPPY PATH TESTS
   ═══════════════════════════════════════ */

test.describe('Settings — happy path', () => {

  test('settings tab loads with the Profile Information heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    await expect(page.getByText('Profile Information')).toBeVisible();
  });

  test('name input is pre-filled with "Alex Morgan"', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await expect(settings.nameInput).toHaveValue('Alex Morgan');
  });

  test('email input is pre-filled with the demo email', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await expect(settings.emailInput).toHaveValue('alex@wealthpulse.demo');
  });

  test('saving a new name shows the "✓ Saved!" confirmation button', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.saveProfile({ name: 'Jordan Lee' });

    // Confirmation state must become visible
    await expect(settings.savedConfirmation).toBeVisible();
  });

  test('confirmation button auto-dismisses and "Save Changes" reappears', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.saveProfile({ name: 'Jordan Lee' });
    await expect(settings.savedConfirmation).toBeVisible();

    // After ~2 s the button reverts to "Save Changes"
    await expect(settings.saveButton).toBeVisible({ timeout: 5000 });
  });

  test('changing currency to EUR persists within the same session', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.saveProfile({ currency: 'EUR' });
    await expect(settings.savedConfirmation).toBeVisible();

    // The select must still show EUR after save
    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  test('changing currency to GBP persists within the same session', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.saveProfile({ currency: 'GBP' });
    await expect(settings.savedConfirmation).toBeVisible();
    await expect(settings.currencySelect).toHaveValue('GBP');
  });

  test('Email Notifications toggle can be switched on', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Default state is OFF; click once to enable
    const toggle = settings.emailNotificationsToggle;
    const classBeforeClick = await toggle.getAttribute('class');

    await toggle.click();

    const classAfterClick = await toggle.getAttribute('class');
    // The toggle background should change (bg-emerald-500 vs bg-slate-700)
    expect(classAfterClick).not.toEqual(classBeforeClick);
  });

  test('Monthly Reports toggle starts ON and can be switched OFF', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Default is ON (bg-emerald-500)
    await expect(settings.monthlyReportsToggle).toHaveClass(/bg-emerald-500/);

    await settings.monthlyReportsToggle.click();

    // After click should be OFF (bg-slate-700)
    await expect(settings.monthlyReportsToggle).toHaveClass(/bg-slate-700/);
  });

  test('updated name propagates to the top-bar avatar', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Change name to "Zara Kim" → initials should be "ZK"
    await settings.saveProfile({ name: 'Zara Kim' });
    await expect(settings.savedConfirmation).toBeVisible();

    // The header avatar button shows initials
    await expect(page.locator('header button').filter({ hasText: 'ZK' })).toBeVisible();
  });

  test('navigating away and back keeps the saved name', async ({ page }) => {
    const factory = new PageFactory(page);
    const settings = factory.settings();

    await settings.saveProfile({ name: 'Taylor Swift' });
    await expect(settings.savedConfirmation).toBeVisible();

    // Navigate to Expenses then back to Settings
    await factory.expenses().navigate();
    await factory.settings().navigate();

    // Name should still be "Taylor Swift"
    await expect(settings.nameInput).toHaveValue('Taylor Swift');
  });

});

/* ═══════════════════════════════════════
   NEGATIVE / EDGE-CASE TESTS
   ═══════════════════════════════════════ */

test.describe('Settings — negative / edge cases', () => {

  test('saving with an empty name field does not crash the app', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Clear the name and save
    await settings.nameInput.fill('');
    await settings.saveButton.click();

    // App should not redirect or throw — settings heading remains visible
    await expect(page.getByText('Profile Information')).toBeVisible();
  });

  test('typing a malformed email (no @) is accepted by the field without hard validation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // The app has no client-side email format validation beyond browser defaults
    await settings.emailInput.fill('notanemail');
    await settings.saveButton.click();

    // Confirmation appears — app stored whatever was typed
    await expect(settings.savedConfirmation).toBeVisible();

    // The field now holds the malformed value
    await expect(settings.emailInput).toHaveValue('notanemail');
  });

  test('Dark Mode toggle is already ON and clicking it turns it OFF', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Default: Dark Mode is ON
    await expect(settings.darkModeToggle).toHaveClass(/bg-emerald-500/);

    await settings.darkModeToggle.click();

    await expect(settings.darkModeToggle).toHaveClass(/bg-slate-700/);
  });

  test('clicking Email Notifications twice returns it to its original state', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    const originalClass = await settings.emailNotificationsToggle.getAttribute('class');

    await settings.emailNotificationsToggle.click();
    await settings.emailNotificationsToggle.click();

    const finalClass = await settings.emailNotificationsToggle.getAttribute('class');
    expect(finalClass).toEqual(originalClass);
  });

  test('save button is still present after saving once (allows repeated saves)', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.saveProfile({ name: 'First Save' });
    await expect(settings.savedConfirmation).toBeVisible();

    // Wait for auto-dismiss then confirm Save button is usable again
    await expect(settings.saveButton).toBeVisible({ timeout: 5000 });

    // A second save should work too
    await settings.saveProfile({ name: 'Second Save' });
    await expect(settings.savedConfirmation).toBeVisible();
  });

});
