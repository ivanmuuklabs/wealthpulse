import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings — currency preference and preferences card tests.
 *
 * The PR (coverage/daily-2026-09-10) covers the "save profile name" flow.
 * These tests complement it by covering:
 *   1. Changing the currency dropdown and saving — the selected option persists.
 *   2. The Settings form pre-fills with demo defaults (Alex Morgan / alex@wealthpulse.demo).
 *   3. The Preferences card is visible with toggle switches.
 *   4. Navigating away from Settings and back preserves the heading.
 *
 * All tests use the SettingsPage page object introduced by the PR.
 */

test.describe('Settings — currency and preferences', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    const settings = factory.settings();
    await settings.navigate();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('profile form pre-fills with demo user defaults', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // The initial state has name "Alex Morgan" and email "alex@wealthpulse.demo"
    await expect(settings.fullNameInput).toHaveValue('Alex Morgan');
    await expect(settings.emailInput).toHaveValue('alex@wealthpulse.demo');

    // Default currency is USD
    await expect(settings.currencySelect).toHaveValue('USD');
  });

  test('changing currency to EUR and saving shows confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Change currency from USD to EUR
    await settings.saveProfile({ currency: 'EUR' });

    // The "✓ Saved!" confirmation must appear
    await expect(settings.savedConfirmation).toBeVisible();

    // The currency select must now reflect EUR
    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  test('Preferences card is visible with all three toggle options', async ({ page }) => {
    // The Settings page has a Preferences card with Dark Mode, Email Notifications,
    // and Monthly Reports toggle switches.
    await expect(page.getByText('Preferences')).toBeVisible();
    await expect(page.getByText('Dark Mode')).toBeVisible();
    await expect(page.getByText('Email Notifications')).toBeVisible();
    await expect(page.getByText('Monthly Reports')).toBeVisible();
  });

  test('navigating away to Dashboard and back to Settings shows the Settings heading', async ({ page }) => {
    // Verify that sidebar navigation to Settings is repeatable (not a one-time render).
    // Navigate away to Charts (Dashboard)
    await page.getByRole('button', { name: /charts/i }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Navigate back to Settings
    const settings = new PageFactory(page).settings();
    await settings.navigate();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Profile inputs must still be visible after the round-trip
    await expect(settings.fullNameInput).toBeVisible();
    await expect(settings.saveButton).toBeVisible();
  });
});
