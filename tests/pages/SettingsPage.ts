import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Settings tab.
 *
 * Covers: profile information form (name, email, currency) and
 * preference toggles (Dark Mode, Email Notifications, Monthly Reports).
 */
export class SettingsPage {
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;
  readonly avatarInitials: Locator;

  // Preference toggles — identified by their label text
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });

    // Profile form (labels use uppercase tracking-widest text)
    this.nameInput = page.locator('label').filter({ hasText: /Full Name/i }).locator('..').locator('input');
    this.emailInput = page.locator('label').filter({ hasText: /^Email$/i }).locator('..').locator('input[type="email"]');
    this.currencySelect = page.locator('label').filter({ hasText: /Currency/i }).locator('..').locator('select');

    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved/i });

    // Avatar initials shown above the form
    this.avatarInitials = page.locator('div.w-16.h-16');

    // Preference toggle buttons — scoped to each label row
    this.darkModeToggle = page
      .locator('label')
      .filter({ hasText: 'Dark Mode' })
      .locator('button');
    this.emailNotificationsToggle = page
      .locator('label')
      .filter({ hasText: 'Email Notifications' })
      .locator('button');
    this.monthlyReportsToggle = page
      .locator('label')
      .filter({ hasText: 'Monthly Reports' })
      .locator('button');
  }

  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /** Update the profile form and save */
  async updateProfile(name: string, email: string, currency?: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    if (currency) {
      await this.currencySelect.selectOption(currency);
    }
    await this.saveButton.click();
  }
}
