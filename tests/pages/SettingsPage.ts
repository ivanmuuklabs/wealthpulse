import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 *
 * Covers the Profile Information form (name, email, currency) and
 * the Preferences toggles section.
 */
export class SettingsPage {
  readonly heading: Locator;

  // Profile fields
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;

  // Avatar initials shown above the form
  readonly avatarInitials: Locator;

  // Preference toggles (by label text)
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });

    this.nameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved!/i });

    // The avatar shows the initials derived from the full name
    this.avatarInitials = page.locator('div.w-16.h-16');

    // Toggle buttons sit inside labels — locate them by the nearby text
    this.darkModeToggle = page.getByText('Dark Mode').locator('..').getByRole('button');
    this.emailNotificationsToggle = page.getByText('Email Notifications').locator('..').getByRole('button');
    this.monthlyReportsToggle = page.getByText('Monthly Reports').locator('..').getByRole('button');
  }

  /** Navigate to the Settings tab via sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /**
   * Update the profile and click Save.
   * Pass only the fields you want to change; undefined fields are left alone.
   */
  async saveProfile({ name, email, currency }: { name?: string; email?: string; currency?: string } = {}) {
    if (name !== undefined) {
      await this.nameInput.clear();
      await this.nameInput.fill(name);
    }
    if (email !== undefined) {
      await this.emailInput.clear();
      await this.emailInput.fill(email);
    }
    if (currency !== undefined) {
      await this.currencySelect.selectOption(currency);
    }
    await this.saveButton.click();
  }
}
