import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Negative / edge-case tests for the Settings tab.
 *
 * User story: As an authenticated user, the Settings tab must handle
 * invalid or empty profile inputs gracefully — saving an empty name must
 * not persist a blank value, special characters must not break the form,
 * and navigating away before saving must discard unsaved changes.
 *
 * Generated from the Settings feature completed in the current sprint
 * (Jira-done-ticket proxy, 2026-09-21).
 */

test.describe('Settings tab — negative / edge-case flows', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.settings().navigate();
    await expect(page.getByRole('button', { name: /settings/i })).toHaveClass(/text-emerald-400/);
  });

  // Negative Test 1 — Saving with an empty display name does not erase the current name
  test('saving with an empty display name keeps the previous name', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    // Clear the name field completely
    await settingsPage.nameInput.clear();
    await settingsPage.saveProfile();

    // After save, the input must not be empty (either the value was preserved
    // or the form prevented the save and restored the previous value)
    const nameValue = await settingsPage.nameInput.inputValue();
    expect(nameValue.trim().length).toBeGreaterThan(0);
  });

  // Negative Test 2 — Navigating away without saving discards the unsaved name
  test('navigating away without saving discards the unsaved display name change', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    // Make an unsaved change
    await settingsPage.updateName('Unsaved Change Name');

    // Navigate away (Charts) without saving
    await page.getByRole('button', { name: 'Charts' }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Come back to Settings
    await settingsPage.navigate();

    // The input must show the original demo value, not the unsaved change
    const nameValue = await settingsPage.nameInput.inputValue();
    expect(nameValue).not.toEqual('Unsaved Change Name');
  });

  // Negative Test 3 — Display name with special characters is accepted without breaking the UI
  test('saving a display name with special characters does not crash the Settings form', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    const specialName = "O'Brien <Test> & \"User\"";
    await settingsPage.updateName(specialName);
    await settingsPage.saveProfile();

    // The form must still be rendered — nameInput and saveButton remain visible
    await expect(settingsPage.nameInput).toBeVisible();
    await expect(settingsPage.saveButton).toBeVisible();
  });

  // Negative Test 4 — Saving with an obviously invalid email format does not crash
  test('saving an invalid email format does not crash the Settings form', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.updateEmail('not-an-email');
    await settingsPage.saveProfile();

    // The form remains functional regardless of validation outcome
    await expect(settingsPage.emailInput).toBeVisible();
    await expect(settingsPage.saveButton).toBeVisible();
  });

  // Negative Test 5 — Saving an extremely long name is handled without breaking the layout
  test('saving a very long display name does not break the Settings layout', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    const longName = 'A'.repeat(200);
    await settingsPage.updateName(longName);
    await settingsPage.saveProfile();

    // The Save button and name input must still be interactable
    await expect(settingsPage.saveButton).toBeVisible();
    await expect(settingsPage.nameInput).toBeVisible();
  });
});
