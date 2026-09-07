import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

// Test 5 — Settings: editing and saving profile, toggling preferences
test.describe('Settings — Profile and Preferences', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const settings = factory.settings();
    await settings.navigate();
  });

  test('clicking Save Changes shows the "Saved!" confirmation on the button', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Modify the full name to a new value
    await settings.setFullName('Demo Tester');

    // Click Save Changes
    await settings.saveProfile();

    // The button should briefly read "Saved!" — wait for it to appear
    await expect(
      page.getByRole('button', { name: /saved!/i })
    ).toBeVisible();
  });

  test('Email Notifications toggle can be switched on and off', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // The toggle is a checkbox; its initial state may be off (unchecked)
    const toggle = settings.emailNotificationsToggle;

    // Record initial state
    const initiallyChecked = await toggle.isChecked();

    // Click once to flip
    await toggle.click();
    expect(await toggle.isChecked()).toBe(!initiallyChecked);

    // Click again to restore
    await toggle.click();
    expect(await toggle.isChecked()).toBe(initiallyChecked);
  });

});
