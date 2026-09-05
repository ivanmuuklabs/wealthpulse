import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Settings tab.
 *
 * Covers:
 *  - Profile information form (name, email, currency)
 *  - Save Changes button + confirmation flash
 *  - Preference toggles (Dark Mode, Email Notifications, Monthly Reports)
 */
export class SettingsPage {
  readonly navButton: Locator;

  // Profile form
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;

  // Avatar initials (reflects saved name)
  readonly avatarInitials: Locator;

  // Preference toggle labels
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /settings/i });

    this.fullNameInput = page.getByLabel('Full Name', { exact: false });
    this.emailInput = page.getByLabel('Email', { exact: false });
    this.currencySelect = page.getByLabel('Currency', { exact: false });
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved/i });

    // Avatar shows first two initials of the saved name
    this.avatarInitials = page.locator('div.rounded-2xl.bg-gradient-to-br').first();

    this.darkModeToggle = page
      .locator('label')
      .filter({ hasText: /dark mode/i })
      .getByRole('button');

    this.emailNotificationsToggle = page
      .locator('label')
      .filter({ hasText: /email notifications/i })
      .getByRole('button');

    this.monthlyReportsToggle = page
      .locator('label')
      .filter({ hasText: /monthly reports/i })
      .getByRole('button');
  }

  async navigate() {
    await this.navButton.click();
  }

  async updateProfile(name: string, email: string, currency?: string) {
    await this.fullNameInput.fill(name);
    await this.emailInput.fill(email);
    if (currency) {
      await this.currencySelect.selectOption(currency);
    }
    await this.saveButton.click();
  }
}
