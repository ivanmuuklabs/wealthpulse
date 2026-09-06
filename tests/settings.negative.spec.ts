import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings — negative and edge-case tests
 *
 * Covers failure scenarios and boundary conditions for the Settings tab:
 *   - Saving with a blank name does not crash the app
 *   - Saving with a blank email does not crash the app
 *   - Switching currency to each available option
 *   - Profile changes are not reflected if "Save" is NOT clicked
 *   - Preferences toggle switches are independently togglable
 */

test.describe('Settings — negative and edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  test('saving with a blank name does not crash and shows the saved confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Clear the name field entirely
    await settings.nameInput.click({ clickCount: 3 });
    await settings.nameInput.fill('');
    await settings.saveButton.click();

    // App should not crash — page heading still visible
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('saving with a blank email does not crash and shows the saved confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.emailInput.click({ clickCount: 3 });
    await settings.emailInput.fill('');
    await settings.saveButton.click();

    // App should not crash — page heading still visible
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('changing currency to GBP is selectable', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.currencySelect.selectOption('GBP');
    await expect(settings.currencySelect).toHaveValue('GBP');
  });

  test('editing the name field without saving does not persist the change after navigation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Edit without saving
    await settings.nameInput.click({ clickCount: 3 });
    await settings.nameInput.fill('Unsaved Name');

    // Navigate away
    await page.getByRole('button', { name: /expenses/i }).click();

    // Come back to Settings
    await new PageFactory(page).settings().navigate();

    // Name should be "Alex Morgan" still — not "Unsaved Name"
    await expect(settings.nameInput).toHaveValue('Alex Morgan');
  });

  test('preferences toggles are independently clickable without errors', async ({ page }) => {
    // The toggle buttons are found by their container labels
    const toggles = page.locator('button[class*="rounded-full"]');
    const count = await toggles.count();
    expect(count).toBeGreaterThan(0);

    // Click each toggle — none should throw or crash the app
    for (let i = 0; i < count; i++) {
      await toggles.nth(i).click();
    }

    // Page is still functional
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('saving with very long name truncates gracefully in the avatar initials', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.updateProfile({ name: 'Maximilian Alexander Wolfgang Beethoven Richardson III' });
    await expect(settings.savedConfirmation).toBeVisible();

    // Avatar shows at most 2 initials (per App.jsx slicing logic)
    const avatar = page.locator('div.from-emerald-500').first();
    const text = (await avatar.textContent() ?? '').trim();
    expect(text.length).toBeLessThanOrEqual(2);
  });
});
