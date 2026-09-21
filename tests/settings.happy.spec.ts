import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Settings tab.
 *
 * User story: As an authenticated user I can view and update my profile
 * (display name, email, currency) and see a confirmation message after
 * saving, with the changes reflected immediately in the UI.
 *
 * Generated from the Settings feature completed in the current sprint
 * (Jira-done-ticket proxy, 2026-09-21).
 */

test.describe('Settings tab — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.settings().navigate();
    // Wait for the Settings section to be visible
    await expect(page.getByRole('button', { name: /settings/i })).toHaveClass(/text-emerald-400/);
  });

  // Happy Test 1 — Settings tab renders the profile form with pre-filled values
  test('Settings tab displays the profile form with the demo user values', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    // The pre-filled name is "Alex Morgan"
    await expect(settingsPage.nameInput).toHaveValue('Alex Morgan');
    // The pre-filled email is the demo email
    await expect(settingsPage.emailInput).toHaveValue('alex@wealthpulse.demo');
  });

  // Happy Test 2 — Updating the display name and saving shows a confirmation
  test('updating the display name and saving shows a success confirmation', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.updateName('Jane Doe');
    await settingsPage.saveProfile();

    // A "Saved!" / "Profile updated" confirmation must appear briefly
    await expect(settingsPage.savedConfirmation).toBeVisible();
  });

  // Happy Test 3 — Updated name persists in the form after saving
  test('updated display name persists in the input after saving', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.updateName('John Smith');
    await settingsPage.saveProfile();

    // After save the input must retain the new value
    await expect(settingsPage.nameInput).toHaveValue('John Smith');
  });

  // Happy Test 4 — Updating email and saving reflects the new value
  test('updating the email and saving persists the new email in the form', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.updateEmail('newemail@example.com');
    await settingsPage.saveProfile();

    await expect(settingsPage.savedConfirmation).toBeVisible();
    await expect(settingsPage.emailInput).toHaveValue('newemail@example.com');
  });

  // Happy Test 5 — Navigating away and back to Settings retains the last saved name
  test('navigating away and back to Settings shows the last saved display name', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.updateName('Persistent Name');
    await settingsPage.saveProfile();
    await expect(settingsPage.savedConfirmation).toBeVisible();

    // Navigate to Charts tab and come back
    await page.getByRole('button', { name: 'Charts' }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await settingsPage.navigate();

    // The updated name must still be in the input
    await expect(settingsPage.nameInput).toHaveValue('Persistent Name');
  });
});
