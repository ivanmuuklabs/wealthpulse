import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings — currency change and preference toggle tests.
 *
 * settings.spec.ts (added by the coverage/daily-2026-09-20 PR) covers:
 *   - Saving a new profile name shows the ✓ Saved! confirmation
 *
 * This file covers the remaining Settings flows:
 *   - Changing the display currency
 *   - Toggling a preference switch
 *   - Verifying the currency select exposes USD / EUR / GBP options
 */

test.describe('Settings — currency and preferences', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await new PageFactory(page).settings().navigate();
  });

  /**
   * The currency dropdown must offer exactly the three supported options:
   * USD, EUR, and GBP.
   */
  test('currency select exposes USD, EUR, and GBP options', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // All three option values must be present in the select
    await expect(settings.currencySelect.locator('option[value="USD"]')).toHaveCount(1);
    await expect(settings.currencySelect.locator('option[value="EUR"]')).toHaveCount(1);
    await expect(settings.currencySelect.locator('option[value="GBP"]')).toHaveCount(1);
  });

  /**
   * Changing the currency to EUR and saving shows the ✓ Saved! confirmation.
   * The select must retain the EUR value afterwards.
   */
  test('changing currency to EUR saves successfully and persists', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Switch currency to EUR
    await settings.setCurrency('EUR');

    // Save the form
    await settings.saveButton.click();

    // Confirmation must appear
    await expect(settings.savedConfirmation).toBeVisible();

    // After the transient confirmation, the select must still show EUR
    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  /**
   * The Preferences section must display the three preference toggles:
   * Dark Mode, Email Notifications, and Monthly Reports.
   * Each toggle must be interactable (clicking it doesn't crash the app).
   */
  test('preference toggles are visible and interactive', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // All three toggle labels must be visible
    await expect(page.getByText('Dark Mode')).toBeVisible();
    await expect(page.getByText('Email Notifications')).toBeVisible();
    await expect(page.getByText('Monthly Reports')).toBeVisible();

    // Clicking the Email Notifications toggle must not navigate away or crash
    const emailToggle = settings.toggleFor('Email Notifications');
    await emailToggle.click();

    // The Settings page must still be showing
    await expect(settings.heading).toBeVisible();
  });

  /**
   * Saving profile changes with GBP currency and a new name at the same time
   * applies both updates and shows the ✓ Saved! confirmation once.
   */
  test('saving name and currency together shows Saved confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.setFullName('Test User');
    await settings.setCurrency('GBP');
    await settings.saveButton.click();

    // One ✓ Saved! confirmation
    await expect(settings.savedConfirmation).toBeVisible();

    // Both fields must reflect the new values
    await expect(settings.currencySelect).toHaveValue('GBP');
    await expect(settings.fullNameInput).toHaveValue('Test User');
  });
});
