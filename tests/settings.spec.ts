import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings — happy-path and negative tests
 *
 * User story: "As a user I can update my Full Name, Email, and Currency
 * in the Settings profile form and receive a visual '✓ Saved!' confirmation.
 * My avatar initials update in real-time and I can toggle preferences."
 *
 * Happy-path covers the save flow, initials update, currency selection,
 * and preference toggles. Negative tests cover empty inputs, unsaved state,
 * and rapid interactions.
 */

/* ─────────────────────────────────────────────────────────────────────
   HAPPY PATH
   ───────────────────────────────────────────────────────────────────── */

test.describe('Settings — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
    await expect(new PageFactory(page).settings().heading).toBeVisible();
  });

  test('Settings page pre-fills Full Name with "Alex Morgan" (demo default)', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await expect(settings.nameInput).toHaveValue('Alex Morgan');
  });

  test('Settings page pre-fills Email with the demo email', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await expect(settings.emailInput).toHaveValue('alex@wealthpulse.demo');
  });

  test('Settings page pre-selects USD as the default currency', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await expect(settings.currencySelect).toHaveValue('USD');
  });

  test('clicking Save Changes shows the "✓ Saved!" confirmation button', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.saveButton.click();

    await expect(settings.savedConfirmation).toBeVisible();
  });

  test('updating Full Name and saving reflects the new name in the profile card', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateName('Jordan Lee');

    await expect(settings.savedConfirmation).toBeVisible();
    // Profile card name should update
    await expect(page.getByText('Jordan Lee').first()).toBeVisible();
  });

  test('updating Full Name updates the avatar initials to the new initials', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateName('Jordan Lee');

    // Top-bar avatar button should now show "JL"
    await expect(settings.topBarAvatarButton).toHaveText('JL');
  });

  test('changing currency to EUR and saving persists EUR as the selected value', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateCurrency('EUR');

    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  test('changing currency to GBP and saving persists GBP as the selected value', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateCurrency('GBP');

    await expect(settings.currencySelect).toHaveValue('GBP');
  });

  test('preference toggles are all visible on the Settings page', async ({ page }) => {
    // 3 preference toggles: Dark Mode, Email Notifications, Monthly Reports
    await expect(page.getByText('Dark Mode')).toBeVisible();
    await expect(page.getByText('Email Notifications')).toBeVisible();
    await expect(page.getByText('Monthly Reports')).toBeVisible();
  });

  test('clicking the "Email Notifications" toggle does not crash the page', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.clickPreferenceToggle('Email Notifications');

    // Settings heading must still be visible after the click
    await expect(settings.heading).toBeVisible();
  });

  test('top-bar avatar button navigates to Settings', async ({ page }) => {
    const factory = new PageFactory(page);

    // Start on Dashboard
    await factory.dashboard().navigate();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Click the top-bar avatar
    await factory.settings().navigateViaTopBar();
    await expect(factory.settings().heading).toBeVisible();
  });
});

/* ─────────────────────────────────────────────────────────────────────
   NEGATIVE / EDGE-CASE TESTS
   ───────────────────────────────────────────────────────────────────── */

test.describe('Settings — negative and edge-case flows', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  test('saving with an empty name does not crash — Settings page remains visible', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.nameInput.clear();
    await settings.saveButton.click();

    // Page should remain stable
    await expect(settings.heading).toBeVisible();
  });

  test('saving with an empty email does not crash — Settings page remains visible', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.emailInput.clear();
    await settings.saveButton.click();

    await expect(settings.heading).toBeVisible();
  });

  test('a very long name (100 chars) is accepted without a crash', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    const longName = 'A'.repeat(100);

    await settings.updateName(longName);

    await expect(settings.savedConfirmation).toBeVisible();
    await expect(settings.heading).toBeVisible();
  });

  test('"✓ Saved!" confirmation auto-dismisses after ~2 seconds', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.saveButton.click();
    await expect(settings.savedConfirmation).toBeVisible();

    // Wait for the 2 s timeout the app sets
    await page.waitForTimeout(2500);

    // The button should revert to "Save Changes"
    await expect(settings.savedConfirmation).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeVisible();
  });

  test('navigating away without saving discards unsaved changes', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Type a new name but do NOT click Save
    await settings.nameInput.clear();
    await settings.nameInput.fill('Unsaved Name Change');

    // Navigate to Expenses and back to Settings
    await page.getByRole('button', { name: /expenses/i }).click();
    await page.getByRole('button', { name: /settings/i }).click();

    // Settings re-mounts from app state — the name should still be "Alex Morgan"
    await expect(settings.nameInput).toHaveValue('Alex Morgan');
  });
});
