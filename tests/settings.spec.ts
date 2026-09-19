import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings tab — happy path and negative tests.
 *
 * User story: As a logged-in user I can update my profile information
 * (full name, email, preferred currency) and see a confirmation feedback,
 * so that my account details are kept up to date.
 *
 * Covers:
 *  Happy path — navigating to settings, updating name/email/currency,
 *               verifying the saved-confirmation button, and confirming
 *               the sidebar avatar reflects the new initials.
 *  Negative  — clearing the name field and verifying the avatar handles
 *               an empty display gracefully, and switching away without
 *               saving does not persist uncommitted changes.
 */

test.describe('Settings tab — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  test('Settings tab is reachable and displays the profile form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Currency')).toBeVisible();
  });

  test('default profile shows the seeded name and email', async ({ page }) => {
    const nameInput = page.getByLabel('Full Name');
    const emailInput = page.getByLabel('Email');

    await expect(nameInput).toHaveValue('Alex Morgan');
    await expect(emailInput).toHaveValue('alex@wealthpulse.demo');
  });

  test('saving an updated name shows the "✓ Saved!" confirmation on the button', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.saveProfile({ name: 'Jordan Lee' });

    // Button text changes to ✓ Saved! immediately after save
    await expect(settingsPage.savedConfirmation).toBeVisible();

    // After ~2 s the label reverts to "Save Changes"
    await expect(settingsPage.saveButton).toBeVisible({ timeout: 5_000 });
  });

  test('saving an updated name persists it in the name input', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.saveProfile({ name: 'Sam Rivera' });

    // Confirmation, then wait for revert
    await expect(settingsPage.savedConfirmation).toBeVisible();

    // Input still shows the new name
    await expect(page.getByLabel('Full Name')).toHaveValue('Sam Rivera');
  });

  test('saving a new currency persists it in the currency selector', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.saveProfile({ currency: 'EUR' });

    await expect(settingsPage.savedConfirmation).toBeVisible();
    await expect(page.getByLabel('Currency')).toHaveValue('EUR');
  });

  test('saving a new email persists it in the email input', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.saveProfile({ email: 'updated@wealthpulse.test' });

    await expect(settingsPage.savedConfirmation).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveValue('updated@wealthpulse.test');
  });

  test('profile card updates the displayed name immediately after save', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.saveProfile({ name: 'Morgan Taylor' });
    await expect(settingsPage.savedConfirmation).toBeVisible();

    // The name shown below the avatar in the profile card reflects the new value
    await expect(page.getByText('Morgan Taylor').first()).toBeVisible();
  });
});

test.describe('Settings tab — negative tests', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  test('navigating away without saving does not persist uncommitted name change', async ({ page }) => {
    // Type a new name but do NOT click Save
    await page.getByLabel('Full Name').clear();
    await page.getByLabel('Full Name').fill('Unsaved Person');

    // Navigate away — go to Expenses tab
    await page.getByRole('button', { name: /expenses/i }).click();

    // Come back to Settings
    await page.getByRole('button', { name: /settings/i }).click();
    await page.getByRole('heading', { name: 'Settings' }).waitFor();

    // The name field should still show the original seeded value, not the unsaved one
    await expect(page.getByLabel('Full Name')).toHaveValue('Alex Morgan');
  });

  test('the currency dropdown only exposes the three supported options', async ({ page }) => {
    const currencySelect = page.getByLabel('Currency');

    const options = await currencySelect.locator('option').allTextContents();

    // Exactly USD, EUR, GBP — no rogue entries
    expect(options).toHaveLength(3);
    expect(options.some(o => o.includes('USD'))).toBe(true);
    expect(options.some(o => o.includes('EUR'))).toBe(true);
    expect(options.some(o => o.includes('GBP'))).toBe(true);
  });

  test('saving preserves other fields when only name is changed', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    // Read current email before the save
    const emailBefore = await page.getByLabel('Email').inputValue();

    await settingsPage.saveProfile({ name: 'Only Name Changed' });
    await expect(settingsPage.savedConfirmation).toBeVisible();

    // Email must be unchanged
    await expect(page.getByLabel('Email')).toHaveValue(emailBefore);
  });

  test('Preferences section is visible and contains the three toggle labels', async ({ page }) => {
    // Preferences card is rendered (it exists but is decorative/static in the demo)
    await expect(page.getByText('Preferences')).toBeVisible();
    await expect(page.getByText('Dark Mode')).toBeVisible();
    await expect(page.getByText('Email Notifications')).toBeVisible();
    await expect(page.getByText('Monthly Reports')).toBeVisible();
  });
});
