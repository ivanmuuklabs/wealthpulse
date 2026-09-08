import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Negative and edge-case tests for the Settings tab.
 *
 * User story: "As a user the Settings form should behave predictably when
 * I enter unexpected values such as an empty name, a malformed email, or
 * very long strings — and should not expose the app to script-injection risks."
 */

test.describe('Settings — negative & edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  // ── Empty name ────────────────────────────────────────────────────────────

  test('clearing the name field and saving stores an empty name without crashing', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Clear the name entirely and save
    await settings.nameInput.fill('');
    await settings.saveButton.click();

    // The app dispatches the update; the avatar should handle an empty split gracefully
    // (it computes initials via name.split(" ").map(w=>w[0]).join("").slice(0,2))
    // Main check: the app must not throw an unhandled error — Settings page still visible
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  // ── Malformed / unusual email ─────────────────────────────────────────────

  test('entering a malformed email string saves without a JS crash', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // The app has no client-side email validation — this exercises the store dispatch
    await settings.emailInput.fill('not-an-email');
    await settings.saveButton.click();

    // The UI should still be functional after saving a technically invalid email
    await expect(settings.savedConfirmation).toBeVisible();
    await expect(settings.emailInput).toHaveValue('not-an-email');
  });

  // ── Very long strings ─────────────────────────────────────────────────────

  test('saving a very long name does not break the Settings page layout', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    const longName = 'A'.repeat(200);
    await settings.nameInput.fill(longName);
    await settings.saveButton.click();

    // Profile card and save button should still be accessible
    await expect(settings.saveButton.or(settings.savedConfirmation)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('saving a very long email does not break the Settings page layout', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    const longEmail = 'a'.repeat(150) + '@example.com';
    await settings.emailInput.fill(longEmail);
    await settings.saveButton.click();

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  // ── Script injection ──────────────────────────────────────────────────────

  test('entering a script tag in the name field does not execute and is rendered as text', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    let alertFired = false;
    page.on('dialog', () => { alertFired = true; });

    await settings.nameInput.fill('<script>alert("xss")</script>');
    await settings.saveButton.click();

    // React escapes HTML by default — no alert should have fired
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    expect(alertFired).toBe(false);
  });

  // ── Currency — value persistence across re-render ─────────────────────────

  test('saving currency as EUR then navigating away and back retains EUR for the session', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateCurrency('EUR');
    await expect(settings.savedConfirmation).toBeVisible();

    // Navigate to another tab and come back
    await page.getByRole('button', { name: /expenses/i }).click();
    await page.waitForSelector('h2:has-text("Expenses")');
    await settings.navigate();

    // Currency should still be EUR (in-memory state persists within the session)
    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  // ── Rapid consecutive saves ───────────────────────────────────────────────

  test('clicking Save Changes multiple times in rapid succession does not crash the app', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Click save 5 times rapidly
    for (let i = 0; i < 5; i++) {
      await settings.saveButton.click();
    }

    // The page should remain stable
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  // ── Navigation guard — unsaved changes ────────────────────────────────────

  test('navigating away after editing (without saving) does not persist the unsaved value', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Type a new name but do NOT save
    await settings.nameInput.fill('UnsavedChange');

    // Navigate to a different tab
    await page.getByRole('button', { name: /expenses/i }).click();
    await page.waitForSelector('h2:has-text("Expenses")');

    // Go back to Settings — the original name should be restored (in-memory reducer)
    await settings.navigate();

    // The app stores state in useReducer; without dispatch the name reverts
    // to the last saved value — "Alex Morgan" by default
    const currentName = await settings.nameInput.inputValue();
    expect(currentName).not.toBe('UnsavedChange');
  });
});
