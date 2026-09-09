import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings — save profile changes
 *
 * Coverage gap: the Settings tab was completely untested. The profile form
 * (name, email, currency) and the "✓ Saved!" transient confirmation are
 * critical user-facing flows with no existing coverage.
 */
test.describe('Settings — save profile changes', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const settings = factory.settings();
    await settings.navigate();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('saving an updated name and email shows the "Saved!" confirmation and persists across navigation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Update profile with new values
    await settings.saveProfile('Jordan Smith', 'jordan@example.com');

    // The transient "✓ Saved!" button text must appear immediately
    await expect(settings.savedConfirmation).toBeVisible();

    // Navigate away to the Dashboard and back to Settings
    await page.getByRole('button', { name: /charts/i }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    await settings.navigate();

    // The updated name must still be displayed in the avatar initials area
    // and in the Full Name input (React state persists within the session)
    await expect(settings.fullNameInput).toHaveValue('Jordan Smith');
    await expect(settings.emailInput).toHaveValue('jordan@example.com');
  });
});
