import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Settings tab.
 * Covers the Profile Information card (name, email, currency, save button)
 * and the Preferences card (toggle switches).
 */
export class SettingsPage {
  readonly heading: Locator;
  readonly settingsNavButton: Locator;

  // Profile Information card
  readonly profileHeading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;
  readonly avatarInitials: Locator;

  // Preferences card
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });
    this.settingsNavButton = page.getByRole('button', { name: 'Settings' });

    // Profile Information
    this.profileHeading = page.getByText('Profile Information');
    this.nameInput = page.locator('input').filter({ hasText: '' }).nth(0);
    // Use label-based approach — Full Name label is immediately above the input
    this.nameInput = page.locator('label').filter({ hasText: /Full Name/i }).locator('..').locator('input');
    this.emailInput = page.locator('label').filter({ hasText: /^Email$/i }).locator('..').locator('input');
    this.currencySelect = page.locator('select');
    this.saveButton = page.getByRole('button', { name: 'Save Changes' });
    this.savedConfirmation = page.getByRole('button', { name: '✓ Saved!' });
    this.avatarInitials = page.locator('header button').filter({ hasText: /^[A-Z]{2}$/ });

    // Preferences — each toggle is a button inside its label row
    this.darkModeToggle = page.locator('label').filter({ hasText: /Dark Mode/ }).locator('button');
    this.emailNotificationsToggle = page.locator('label').filter({ hasText: /Email Notifications/ }).locator('button');
    this.monthlyReportsToggle = page.locator('label').filter({ hasText: /Monthly Reports/ }).locator('button');
  }

  async navigate() {
    await this.settingsNavButton.click();
    await this.heading.waitFor({ state: 'visible' });
  }

  async saveName(newName: string) {
    await this.nameInput.triple_click?.() ?? await this.nameInput.click({ clickCount: 3 });
    await this.nameInput.fill(newName);
    await this.saveButton.click();
  }
}
