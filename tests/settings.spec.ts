import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Gap coverage added by Amikoo QA review of PR #48.
 *
 * The Settings tab had zero test coverage across the entire suite.
 * These tests verify the Profile Information card and the Preferences
 * toggles that are rendered by SettingsTab in App.jsx (Section 11).
 *
 * Happy path: profile loads pre-filled, save shows confirmation, currency
 *   can be changed, toggles can be switched.
 * Negative path: save is re-usable after confirmation auto-dismisses, empty
 *   name is stored without crash, email Notifications can be toggled back.
 */

test.describe('Settings — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    const settingsPage = factory.settings();
    await settingsPage.navigate();
  });

  test('Settings heading is visible after navigating from Charts', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('"Profile Information" card heading is visible', async ({ page }) => {
    await expect(page.getByText('Profile Information')).toBeVisible();
  });

  test('name input is pre-filled with the demo user name', async ({ page }) => {
    const factory = new PageFactory(page);
    const settingsPage = factory.settings();
    // Demo user is "Alex Morgan" (set in initialState)
    await expect(settingsPage.nameInput).toHaveValue('Alex Morgan');
  });

  test('email input is pre-filled with the demo user email', async ({ page }) => {
    const factory = new PageFactory(page);
    const settingsPage = factory.settings();
    await expect(settingsPage.emailInput).toHaveValue('alex@wealthpulse.demo');
  });

  test('saving a new name shows "✓ Saved!" confirmation', async ({ page }) => {
    const factory = new PageFactory(page);
    const settingsPage = factory.settings();

    await settingsPage.updateName('Jordan Smith');

    // The button text toggles to "✓ Saved!" immediately after dispatch
    await expect(settingsPage.savedConfirmation).toBeVisible();
  });

  test('"✓ Saved!" confirmation auto-dismisses and "Save Changes" returns', async ({ page }) => {
    const factory = new PageFactory(page);
    const settingsPage = factory.settings();

    await settingsPage.updateName('Jordan Smith');
    await expect(settingsPage.savedConfirmation).toBeVisible();

    // The app calls setTimeout(2000) to reset — wait with Playwright auto-wait
    await expect(settingsPage.saveButton).toBeVisible({ timeout: 4000 });
  });

  test('currency can be changed to EUR and the select reflects the choice', async ({ page }) => {
    const factory = new PageFactory(page);
    const settingsPage = factory.settings();

    await settingsPage.currencySelect.selectOption('EUR');
    await expect(settingsPage.currencySelect).toHaveValue('EUR');
  });

  test('top-bar avatar initials update after changing the name', async ({ page }) => {
    const factory = new PageFactory(page);
    const settingsPage = factory.settings();

    // Change to a name whose initials differ from "AM"
    await settingsPage.updateName('Taylor Reed');
    await expect(settingsPage.savedConfirmation).toBeVisible();

    // After save, avatar should show "TR"
    await expect(settingsPage.topBarAvatar).toHaveText('TR');
  });

  test('Email Notifications toggle can be switched on', async ({ page }) => {
    const factory = new PageFactory(page);
    const settingsPage = factory.settings();

    // Default: Email Notifications is OFF (bg-slate-700)
    const toggle = settingsPage.emailNotificationsToggle;
    await expect(toggle).toHaveClass(/bg-slate-700/);

    await toggle.click();

    // After click it should be ON (bg-emerald-500)
    await expect(toggle).toHaveClass(/bg-emerald-500/);
  });

  test('Monthly Reports toggle starts ON and can be switched OFF', async ({ page }) => {
    const factory = new PageFactory(page);
    const settingsPage = factory.settings();

    // Default: Monthly Reports is ON (bg-emerald-500)
    const toggle = settingsPage.monthlyReportsToggle;
    await expect(toggle).toHaveClass(/bg-emerald-500/);

    await toggle.click();

    // After click it should be OFF (bg-slate-700)
    await expect(toggle).toHaveClass(/bg-slate-700/);
  });

  test('Preferences card heading is visible', async ({ page }) => {
    await expect(page.getByText('Preferences')).toBeVisible();
  });
});

test.describe('Settings — negative / edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    const settingsPage = factory.settings();
    await settingsPage.navigate();
  });

  test('Save Changes button is reusable after the confirmation auto-dismisses', async ({ page }) => {
    const factory = new PageFactory(page);
    const settingsPage = factory.settings();

    // First save
    await settingsPage.updateName('Jordan Smith');
    await expect(settingsPage.savedConfirmation).toBeVisible();
    await expect(settingsPage.saveButton).toBeVisible({ timeout: 4000 });

    // Second save should also show confirmation (button is reusable)
    await settingsPage.saveButton.click();
    await expect(settingsPage.savedConfirmation).toBeVisible();
  });

  test('saving with an empty name does not crash the app — heading stays visible', async ({ page }) => {
    const factory = new PageFactory(page);
    const settingsPage = factory.settings();

    // Clear the name field
    await settingsPage.nameInput.click({ clickCount: 3 });
    await settingsPage.nameInput.fill('');
    await settingsPage.saveButton.click();

    // The app should not crash — Settings heading remains visible
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('Dark Mode toggle starts ON and can be toggled OFF', async ({ page }) => {
    const factory = new PageFactory(page);
    const settingsPage = factory.settings();

    // Default: Dark Mode is ON
    const toggle = settingsPage.darkModeToggle;
    await expect(toggle).toHaveClass(/bg-emerald-500/);

    await toggle.click();
    await expect(toggle).toHaveClass(/bg-slate-700/);
  });

  test('double-clicking Email Notifications toggle returns it to original state', async ({ page }) => {
    const factory = new PageFactory(page);
    const settingsPage = factory.settings();

    const toggle = settingsPage.emailNotificationsToggle;
    // Start state: OFF
    await expect(toggle).toHaveClass(/bg-slate-700/);

    await toggle.click(); // ON
    await toggle.click(); // back to OFF

    await expect(toggle).toHaveClass(/bg-slate-700/);
  });

  test('navigating away from Settings and back preserves the heading', async ({ page }) => {
    // Go to another tab
    await page.getByRole('button', { name: 'Charts' }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Return to Settings
    const factory = new PageFactory(page);
    await factory.settings().navigate();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByText('Profile Information')).toBeVisible();
  });
});
