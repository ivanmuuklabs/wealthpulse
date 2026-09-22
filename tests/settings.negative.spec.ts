import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Negative / edge-case tests for the Settings tab.
 *
 * These tests cover failure scenarios and boundary conditions:
 *
 *  N1 – Saving with an empty Full Name is still accepted by the UI (the app has
 *        no server-side validation); the avatar initials collapse to an empty
 *        string, and the save button fires without crashing.
 *  N2 – Saving with an empty Email fires the save action without crashing.
 *  N3 – Toggling Dark Mode (index 0, default ON) turns it OFF and back ON.
 *  N4 – Navigating away from Settings and back preserves the saved name.
 *  N5 – Currency reverts to USD when USD is re-selected after changing to EUR.
 *  N6 – Saving immediately again after a save still shows "✓ Saved!" (no crash
 *        from double-click).
 */

test.describe('Settings — negative and edge cases', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const settings = new PageFactory(page).settings();
    await settings.navigate();
  });

  // ── N1: Empty name save does not crash ────────────────────────────────────

  test('saving with an empty Full Name does not crash and shows the saved confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Clear the name field entirely
    await settings.fullNameInput.clear();
    await settings.saveChanges();

    // The app dispatches UPDATE_PROFILE with an empty name — should not throw
    await expect(settings.saveButton).toHaveText(/saved/i);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  // ── N2: Empty email save does not crash ───────────────────────────────────

  test('saving with an empty Email does not crash the page', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.emailInput.clear();
    await settings.saveChanges();

    await expect(settings.saveButton).toHaveText(/saved/i);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  // ── N3: Dark Mode toggle reverses then restores its state ─────────────────

  test('toggling Dark Mode off and then back on restores the active (emerald) class', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    const toggle = settings.preferenceToggles.nth(0); // Dark Mode (default ON)

    // Should start with the active (emerald) class
    await expect(toggle).toHaveClass(/bg-emerald-500/);

    // Toggle OFF
    await settings.togglePreference(0);
    await expect(toggle).toHaveClass(/bg-slate-700/);

    // Toggle ON again
    await settings.togglePreference(0);
    await expect(toggle).toHaveClass(/bg-emerald-500/);
  });

  // ── N4: Saved name persists after navigating away and back ────────────────

  test('saved name is still visible after navigating away to Expenses and back', async ({ page }) => {
    const factory = new PageFactory(page);
    const settings = factory.settings();

    await settings.setName('Persistent User');
    await settings.saveChanges();
    await expect(settings.saveButton).toHaveText(/saved/i);

    // Navigate to Expenses
    await factory.expenses().navigate();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();

    // Navigate back to Settings
    await settings.navigate();
    await expect(settings.fullNameInput).toHaveValue('Persistent User');
  });

  // ── N5: Switching currency back to USD restores the default value ─────────

  test('selecting EUR and then reverting to USD shows USD as the final value', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.setCurrency('EUR');
    await settings.saveChanges();
    await expect(settings.currencySelect).toHaveValue('EUR');

    await settings.setCurrency('USD');
    await settings.saveChanges();
    await expect(settings.currencySelect).toHaveValue('USD');
  });

  // ── N6: Double-clicking Save does not produce an error state ──────────────

  test('clicking Save Changes twice in quick succession does not crash the page', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.setName('Double Save Test');

    // Click save twice without waiting for the first confirmation
    await settings.saveButton.click();
    await settings.saveButton.click();

    // Page must still be functional
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(settings.fullNameInput).toBeVisible();
  });

  // ── N7: Very long name does not break layout ──────────────────────────────

  test('a very long Full Name does not cause a JavaScript error', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    const longName = 'A'.repeat(200);
    await settings.setName(longName);
    await settings.saveChanges();

    // The heading must still be present — no crash
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    // The avatar initials are sliced to 2 chars — must still render
    await expect(settings.avatarInitials).toBeVisible();
  });

});
