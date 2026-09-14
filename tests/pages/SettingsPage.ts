import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Settings tab.
 *
 * Covers the Profile Information card (name, email, currency, save)
 * and the Preferences toggles.
 */
export class SettingsPage {
  readonly heading: Locator;

  // Profile form
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;

  // Avatar initials shown in the profile card
  readonly avatarInitials: Locator;

  // Preferences toggles (by their visible labels)
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });

    this.nameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ Saved!/i });

    // The avatar shows initials derived from the name
    this.avatarInitials = page.locator('.w-16.h-16.rounded-2xl');

    this.darkModeToggle = page
      .locator('label', { hasText: 'Dark Mode' })
      .getByRole('button');
    this.emailNotificationsToggle = page
      .locator('label', { hasText: 'Email Notifications' })
      .getByRole('button');
    this.monthlyReportsToggle = page
      .locator('label', { hasText: 'Monthly Reports' })
      .getByRole('button');
  }

  /** Navigate to the Settings tab from the sidebar */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /** Fill the profile form and save */
  async updateProfile(name: string, email: string, currency?: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
    await this.emailInput.clear();
    await this.emailInput.fill(email);
    if (currency) {
      await this.currencySelect.selectOption(currency);
    }
    await this.saveButton.click();
  }
}
