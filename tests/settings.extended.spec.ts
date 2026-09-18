import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Extended tests for the Settings tab.
 *
 * The PR's settings.spec.ts covers the "save display name → confirmation"
 * happy path. This companion spec covers additional flows introduced by
 * SettingsPage.ts that were left untested:
 *   1. Currency selection persists after Save
 *   2. Email Notifications preference toggle changes its visual state
 *   3. Settings page is NOT accessible without authentication
 *   4. Profile form is pre-populated with the demo user's seeded data
 */

test.describe('Settings — extended flows', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const settings = factory.settings();
    await settings.navigate();
  });

  test('changing currency to EUR and saving reflects the EUR option as selected', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Switch from USD to EUR and save
    await settings.currencySelect.selectOption('EUR');
    await settings.saveButton.click();

    // Confirmation badge must appear briefly
    await expect(settings.savedConfirmation).toBeVisible();

    // After the confirmation fades the select must still show EUR
    // (re-check within the 2-second auto-reset window)
    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  test('Email Notifications toggle switches its visual state on click', async ({ page }) => {
    // The Email Notifications toggle defaults to OFF (defaultOn: false per App.jsx)
    // After clicking it should be ON (emerald background).
    const toggle = page
      .locator('label')
      .filter({ hasText: 'Email Notifications' })
      .getByRole('button');

    // Capture the initial background class (should contain 'bg-slate-700' for OFF)
    const initialClass = await toggle.getAttribute('class');
    expect(initialClass).toContain('bg-slate-700');

    // Click to enable
    await toggle.click();

    // Should now be ON (emerald)
    await expect(toggle).toHaveClass(/bg-emerald-500/);
  });

  test('profile form is pre-populated with the demo user data', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // The seeded user is: name "Alex Morgan", email "alex@wealthpulse.demo"
    await expect(settings.fullNameInput).toHaveValue('Alex Morgan');
    await expect(settings.emailInput).toHaveValue('alex@wealthpulse.demo');
    await expect(settings.currencySelect).toHaveValue('USD');
  });

  test('Settings page is not accessible before login (redirects to login screen)', async ({ page }) => {
    // Open a fresh page (no session)
    await page.goto('http://localhost:5173');
    // App shows the LoginScreen when not authenticated
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    // The Settings heading must NOT be present
    await expect(page.getByRole('heading', { name: 'Settings' })).not.toBeVisible();
  });
});
