import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings Tab — Happy Path & Negative Tests
 *
 * User story: As a logged-in user I can update my profile information and
 * toggle preferences in the Settings tab so that my account reflects my choices.
 */

test.describe('Settings — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  // ─── Navigation ──────────────────────────────────────────────────────────────

  test('Settings tab is reachable and shows the profile form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByLabel('Full Name', { exact: false })).toBeVisible();
    await expect(page.getByLabel('Email', { exact: false })).toBeVisible();
  });

  // ─── Save profile ────────────────────────────────────────────────────────────

  test('updating the full name and saving shows a confirmation flash', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateProfile('Jordan Smith', 'jordan@example.com');

    // The button text changes to "✓ Saved!" briefly
    await expect(settings.savedConfirmation).toBeVisible();
  });

  test('saved name is reflected in the avatar initials', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Set a recognisable name: "Quinn Taylor" → initials "QT"
    await settings.updateProfile('Quinn Taylor', 'quinn@example.com');
    await expect(settings.savedConfirmation).toBeVisible();

    // The avatar element (gradient div) should contain the initials "QT"
    await expect(page.locator('div.rounded-2xl.bg-gradient-to-br').first()).toContainText('QT');
  });

  test('clicking the avatar in the top bar navigates to Settings', async ({ page }) => {
    // First navigate away to Dashboard
    await page.getByRole('button', { name: /charts/i }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Click the top-bar avatar button
    await page.locator('header button').last().click();

    // Should now be on Settings
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  // ─── Currency selector ───────────────────────────────────────────────────────

  test('changing currency to EUR and saving persists the selection', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.currencySelect.selectOption('EUR');
    await settings.saveButton.click();

    await expect(settings.savedConfirmation).toBeVisible();

    // After save, the select should still show EUR
    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  // ─── Preference toggles ──────────────────────────────────────────────────────

  test('Email Notifications toggle can be switched on', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // It starts off by default — click to enable
    await settings.emailNotificationsToggle.click();

    // After clicking, the toggle button background should be emerald (on)
    await expect(settings.emailNotificationsToggle).toHaveClass(/bg-emerald-500/);
  });

  test('Monthly Reports toggle can be switched off', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // It starts on by default — click to disable
    await settings.monthlyReportsToggle.click();

    // After clicking once, the background should be slate (off)
    await expect(settings.monthlyReportsToggle).toHaveClass(/bg-slate-700/);
  });
});

test.describe('Settings — negative and edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  // Negative 1 — Clearing the full name field and saving still triggers save
  //              (the app does not validate that name is non-empty)
  test('saving with an empty name still shows the confirmation flash', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.fullNameInput.clear();
    await settings.saveButton.click();

    // App allows saving even with blank name — confirmation still appears
    await expect(settings.savedConfirmation).toBeVisible();
  });

  // Negative 2 — Saving with an invalid email format does not block the save
  //              (client-side only app, no server validation)
  test('saving with an invalid email format still shows the confirmation flash', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.emailInput.fill('not-an-email');
    await settings.saveButton.click();

    await expect(settings.savedConfirmation).toBeVisible();
  });

  // Negative 3 — The "✓ Saved!" flash disappears automatically after ~2 seconds
  test('confirmation flash disappears on its own without user interaction', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.saveButton.click();
    await expect(settings.savedConfirmation).toBeVisible();

    // Wait for the auto-hide timeout (app uses 2000 ms)
    await page.waitForTimeout(2500);

    await expect(settings.savedConfirmation).not.toBeVisible();
    // The button reverts to "Save Changes"
    await expect(settings.saveButton).toBeVisible();
  });

  // Negative 4 — Dark Mode toggle cannot actually be turned off
  //              (it reverts to on due to the theme always being dark)
  test('Dark Mode toggle state toggles visually on each click', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Record initial class state
    const initiallyOn = await settings.darkModeToggle
      .getAttribute('class')
      .then(c => c?.includes('bg-emerald-500') ?? false);

    // Click to toggle
    await settings.darkModeToggle.click();
    const afterFirstClick = await settings.darkModeToggle
      .getAttribute('class')
      .then(c => c?.includes('bg-emerald-500') ?? false);

    // State must have changed
    expect(afterFirstClick).not.toBe(initiallyOn);
  });

  // Negative 5 — GBP currency option is available and can be selected
  test('GBP is selectable in the currency dropdown', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.currencySelect.selectOption('GBP');
    await expect(settings.currencySelect).toHaveValue('GBP');
  });

  // Negative 6 — Updating both name and email in one save round-trip works
  test('updating name and email together persists both in a single save', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.fullNameInput.fill('Morgan Lee');
    await settings.emailInput.fill('morgan@test.com');
    await settings.saveButton.click();

    await expect(settings.savedConfirmation).toBeVisible();

    // Avatar initials should reflect the new name
    await expect(page.locator('div.rounded-2xl.bg-gradient-to-br').first()).toContainText('ML');
  });
});
