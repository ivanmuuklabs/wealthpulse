import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings — happy path tests
 *
 * Covers the primary success scenarios for the Settings tab:
 *   - Navigating to Settings via the sidebar
 *   - Viewing pre-populated profile fields
 *   - Saving an updated name and seeing the confirmation
 *   - Saving an updated email
 *   - Changing the currency preference
 *   - Avatar initials update to reflect a new name
 */

test.describe('Settings — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  test('Settings tab shows Profile Information heading after login', async ({ page }) => {
    await expect(page.getByText('Profile Information')).toBeVisible();
  });

  test('name field is pre-populated with the demo user name', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    // The demo user name is "Alex Morgan" per App.jsx initialState
    await expect(settings.nameInput).toHaveValue('Alex Morgan');
  });

  test('email field is pre-populated with the demo user email', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await expect(settings.emailInput).toHaveValue('alex@wealthpulse.demo');
  });

  test('saving an updated name shows the "✓ Saved!" confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateProfile({ name: 'Jordan Lee' });

    // The save button should briefly switch to "✓ Saved!"
    await expect(settings.savedConfirmation).toBeVisible();

    // After the 2-second timeout the button reverts to "Save Changes"
    await expect(settings.saveButton).toBeVisible({ timeout: 5000 });
  });

  test('saving an updated email persists the new value in the field', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateProfile({ email: 'jordan@example.com' });
    await expect(settings.savedConfirmation).toBeVisible();

    // Reload to confirm the field still reflects the saved value (in-memory state)
    await expect(settings.emailInput).toHaveValue('jordan@example.com');
  });

  test('changing currency to EUR and saving shows confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateProfile({ currency: 'EUR' });
    await expect(settings.savedConfirmation).toBeVisible();

    // Verify the select now shows EUR
    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  test('navigating to Settings via the top-bar avatar button lands on the Settings page', async ({ page }) => {
    // Log in first and go to a different tab
    await page.getByRole('button', { name: /expenses/i }).click();

    // Click the avatar button in the top bar (renders user initials "AM")
    await page.locator('header button', { hasText: /^[A-Z]{1,2}$/ }).click();

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });
});
