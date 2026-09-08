import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Settings tab.
 *
 * User story: "As a user I can update my profile name, email and preferred
 * currency so that the app reflects my personal information correctly."
 *
 * All state is in-memory; changes persist for the current browser session.
 */

test.describe('Settings — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  // ── Save confirmation ─────────────────────────────────────────────────────

  test('clicking Save Changes shows the "✓ Saved!" confirmation message', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Trigger a save without changing any field
    await settings.saveButton.click();

    // The button should briefly change label to "✓ Saved!"
    await expect(settings.savedConfirmation).toBeVisible();
  });

  // ── Update name ───────────────────────────────────────────────────────────

  test('updating the Full Name field and saving reflects the new name in the profile card', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    const newName = 'Jane Tester';
    await settings.nameInput.fill(newName);
    await settings.saveButton.click();

    // The profile card inside Settings should immediately show the new name
    await expect(page.getByText(newName).first()).toBeVisible();
  });

  test('the avatar initials update when the name is changed', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Change name so initials become "ZZ"
    await settings.nameInput.fill('Zelda Zorro');
    await settings.saveButton.click();

    // The header avatar button should display "ZZ"
    await expect(page.locator('header button').filter({ hasText: 'ZZ' })).toBeVisible();
  });

  // ── Update email ──────────────────────────────────────────────────────────

  test('updating the Email field and saving shows the new email in the profile card', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    const newEmail = 'qa.tester@wealthpulse.test';
    await settings.emailInput.fill(newEmail);
    await settings.saveButton.click();

    // Email should appear in the profile sub-heading
    await expect(page.getByText(newEmail)).toBeVisible();
  });

  // ── Currency change ───────────────────────────────────────────────────────

  test('changing currency to EUR and saving completes without error', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateCurrency('EUR');

    // Confirmation fires and the select now shows EUR
    await expect(settings.savedConfirmation).toBeVisible();
    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  test('changing currency to GBP and back to USD persists the final value', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateCurrency('GBP');
    await expect(settings.savedConfirmation).toBeVisible();

    // Save confirmation disappears after ~2 s — wait then change again
    await expect(settings.saveButton).toBeVisible();
    await settings.updateCurrency('USD');
    await expect(settings.savedConfirmation).toBeVisible();

    // Final persisted value should be USD
    await expect(settings.currencySelect).toHaveValue('USD');
  });

  // ── Profile card avatar ───────────────────────────────────────────────────

  test('settings page shows the current user avatar with correct initials on load', async ({ page }) => {
    // Default user is "Alex Morgan" → initials "AM"
    // The avatar is shown both in the profile card and in the header
    const avatarElements = page.locator('div, button').filter({ hasText: /^AM$/ });
    await expect(avatarElements.first()).toBeVisible();
  });
});
