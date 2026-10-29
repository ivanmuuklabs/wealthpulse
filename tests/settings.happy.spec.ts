import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Settings tab.
 *
 * User story: As a user I can update my profile information (name, email,
 * currency) and toggle app preferences so that the app reflects my personal
 * details and preferences.
 */

test.describe('Settings — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    await factory.settings().navigate();
    await expect(factory.settings().heading).toBeVisible();
  });

  // ── Story: view profile ────────────────────────────────────────────────

  test('Settings page loads with the Profile Information section visible', async ({ page }) => {
    await expect(page.getByText('Profile Information')).toBeVisible();
  });

  test('default profile name is Alex Morgan', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await expect(settings.nameInput).toHaveValue('Alex Morgan');
  });

  test('default profile email is alex@wealthpulse.demo', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await expect(settings.emailInput).toHaveValue('alex@wealthpulse.demo');
  });

  test('default currency is USD', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await expect(settings.currencySelect).toHaveValue('USD');
  });

  // ── Story: update profile ──────────────────────────────────────────────

  test('saving a new name shows the "✓ Saved!" confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.nameInput.fill('Jordan Lee');
    await settings.saveButton.click();

    // The button text should temporarily change to "✓ Saved!"
    await expect(settings.savedConfirmation).toBeVisible();
  });

  test('updated name persists in the input after saving', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.nameInput.fill('Morgan Riley');
    await settings.saveButton.click();

    await expect(settings.savedConfirmation).toBeVisible();
    await expect(settings.nameInput).toHaveValue('Morgan Riley');
  });

  test('changing currency to EUR and saving persists the selection', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.currencySelect.selectOption('EUR');
    await settings.saveButton.click();

    await expect(settings.savedConfirmation).toBeVisible();
    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  test('changing currency to GBP and saving persists the selection', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.currencySelect.selectOption('GBP');
    await settings.saveButton.click();

    await expect(settings.savedConfirmation).toBeVisible();
    await expect(settings.currencySelect).toHaveValue('GBP');
  });

  test('saving a new email persists in the email input', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.emailInput.fill('newuser@example.com');
    await settings.saveButton.click();

    await expect(settings.savedConfirmation).toBeVisible();
    await expect(settings.emailInput).toHaveValue('newuser@example.com');
  });

  // ── Story: avatar initials ─────────────────────────────────────────────

  test('avatar shows the correct initials for the default user name', async ({ page }) => {
    // Default: "Alex Morgan" → initials "AM"
    await expect(page.getByText('AM').first()).toBeVisible();
  });

  // ── Story: preference toggles ──────────────────────────────────────────

  test('Preferences section is visible with three toggle items', async ({ page }) => {
    await expect(page.getByText('Preferences')).toBeVisible();
    await expect(page.getByText('Dark Mode')).toBeVisible();
    await expect(page.getByText('Email Notifications')).toBeVisible();
    await expect(page.getByText('Monthly Reports')).toBeVisible();
  });

  test('clicking the Email Notifications toggle changes its state', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Capture the initial class before toggling
    const initialClass = await settings.emailNotificationsToggle.getAttribute('class');
    await settings.emailNotificationsToggle.click();
    const afterClass = await settings.emailNotificationsToggle.getAttribute('class');

    // The toggle background class should change
    expect(initialClass).not.toEqual(afterClass);
  });

  test('clicking the Monthly Reports toggle changes its state', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    const initialClass = await settings.monthlyReportsToggle.getAttribute('class');
    await settings.monthlyReportsToggle.click();
    const afterClass = await settings.monthlyReportsToggle.getAttribute('class');

    expect(initialClass).not.toEqual(afterClass);
  });

  // ── Story: navigation to settings via avatar button ────────────────────

  test('clicking the avatar button in the top bar navigates to Settings', async ({ page }) => {
    const factory = new PageFactory(page);

    // First navigate away from settings
    await page.getByRole('button', { name: /charts/i }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Click the avatar button in the top-right header
    await page.locator('header button').last().click();

    await expect(factory.settings().heading).toBeVisible();
  });
});
