import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Additional tests for the Settings section.
 *
 * settings.spec.ts (in this PR) covers saving the Full Name → "Saved!"
 * confirmation and avatar initials update.
 *
 * This file covers the remaining untested Settings flows:
 *   12. Updating the email field and saving persists the new value in the input.
 *   13. Switching currency to EUR and saving persists the EUR selection.
 *   14. Each of the three preference toggles can be clicked and its visual
 *       state changes (on → off or off → on).
 */

test.describe('Settings — additional flows', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const settings = factory.settings();
    await settings.navigate();

    // Confirm we're on the Settings page
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
  });

  // ── Test 12 ──────────────────────────────────────────────────────────
  // Updating the email input and saving must cause the new email value
  // to persist in the input field (the UPDATE_PROFILE reducer stores it).
  test('updating email and saving persists the new email in the input', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    const newEmail = 'newemail@wealthpulse.test';

    // Clear and set a new email
    await settings.emailInput.clear();
    await settings.emailInput.fill(newEmail);

    // Save
    await settings.saveProfile();
    await expect(settings.saveChangesButton).toHaveText(/saved!/i);

    // After the Saved! label fades (2 s timeout in the app), the button
    // reverts. We verify the persisted email right after clicking Save.
    await expect(settings.emailInput).toHaveValue(newEmail);
  });

  // ── Test 13 ──────────────────────────────────────────────────────────
  // Switching the currency selector to EUR and saving must persist EUR
  // as the selected option in the dropdown.
  test('switching currency to EUR and saving persists the selection', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Select EUR from the currency dropdown
    await settings.currencySelect.selectOption('EUR');

    // Save
    await settings.saveProfile();
    await expect(settings.saveChangesButton).toHaveText(/saved!/i);

    // The dropdown must still show EUR
    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  // ── Test 14 ──────────────────────────────────────────────────────────
  // All three preference toggles (Dark Mode, Email Notifications, Monthly
  // Reports) must respond to a click: the aria-pressed state (or the inner
  // thumb position) must change. We verify by checking the toggle button's
  // class changes between the on/off colour states.
  test('preference toggles change visual state on click', async ({ page }) => {
    // Dark Mode is ON by default (bg-emerald-500); clicking turns it OFF (bg-slate-700)
    const darkModeToggle = page.getByLabel('Dark Mode').locator('..');
    // The actual toggle button is a sibling — locate it via the label's parent row
    const darkModeButton = page
      .locator('label', { hasText: /Dark Mode/ })
      .locator('button');

    await expect(darkModeButton).toHaveClass(/bg-emerald-500/);
    await darkModeButton.click();
    await expect(darkModeButton).toHaveClass(/bg-slate-700/);

    // Email Notifications is OFF by default; clicking turns it ON
    const emailNotifButton = page
      .locator('label', { hasText: /Email Notifications/ })
      .locator('button');

    await expect(emailNotifButton).toHaveClass(/bg-slate-700/);
    await emailNotifButton.click();
    await expect(emailNotifButton).toHaveClass(/bg-emerald-500/);

    // Monthly Reports is ON by default; clicking turns it OFF
    const monthlyReportsButton = page
      .locator('label', { hasText: /Monthly Reports/ })
      .locator('button');

    await expect(monthlyReportsButton).toHaveClass(/bg-emerald-500/);
    await monthlyReportsButton.click();
    await expect(monthlyReportsButton).toHaveClass(/bg-slate-700/);
  });
});
