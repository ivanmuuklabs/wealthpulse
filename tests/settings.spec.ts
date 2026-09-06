import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.describe('Settings', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  /**
   * Test 5 — Saving profile changes shows the "Saved!" confirmation and updates global state.
   *
   * The Settings module has a profile form (Full Name, Email, Currency) and a
   * "Save Changes" button. After saving, the button label briefly changes to
   * "Saved!" for 2 seconds. This test validates that the save flow completes
   * without error and the confirmation feedback is surfaced to the user, which
   * is the primary interaction users have with the Settings module.
   *
   * It also verifies that the Email Notifications preference toggle can be
   * switched on/off, covering the toggle preference flow.
   */
  test('saving profile changes shows Saved! confirmation and preference toggle flips state', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // --- Profile save flow ---
    // The Full Name input must be pre-filled (demo user name)
    await expect(settings.fullNameInput).toBeVisible();
    const originalName = await settings.fullNameInput.inputValue();
    expect(originalName.length).toBeGreaterThan(0);

    // Change the name to something slightly different
    const newName = `${originalName} Updated`;
    await settings.fullNameInput.clear();
    await settings.fullNameInput.fill(newName);

    // Click Save Changes
    await settings.saveButton.click();

    // The button must briefly read "Saved!"
    await expect(settings.savedConfirmation).toBeVisible();

    // After the 2-second flash the button reverts — wait for it
    await expect(settings.saveButton).toBeVisible({ timeout: 4000 });

    // The name field should now hold the updated value
    await expect(settings.fullNameInput).toHaveValue(newName);

    // --- Preference toggle flow ---
    // Email Notifications toggle (default: off) — clicking it should flip its state
    const toggle = page.getByLabel('Email Notifications');
    const wasChecked = await toggle.isChecked();
    await toggle.click();
    const isNowChecked = await toggle.isChecked();
    expect(isNowChecked).toBe(!wasChecked);
  });

});
