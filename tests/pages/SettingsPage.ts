import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 *
 * Covers: Profile form (Full Name, Email, Currency, Save button)
 * and the Preferences toggle switches.
 */
export class SettingsPage {
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;

  // Avatar initials shown in the profile card header
  readonly avatarInitials: Locator;

  // Preference toggle labels
  readonly preferencesSection: Locator;

  constructor(private page: Page) {
    this.fullNameInput      = page.getByLabel('Full Name');
    this.emailInput         = page.getByLabel('Email');
    this.currencySelect     = page.getByLabel('Currency');
    this.saveButton         = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation  = page.getByRole('button', { name: /✓ saved!/i });

    // The avatar shows initials derived from the user's name
    this.avatarInitials = page.locator('div.rounded-2xl.bg-gradient-to-br').first();

    this.preferencesSection = page.getByText('Preferences').first();
  }

  /** Navigate to Settings via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
    await this.page.getByRole('heading', { name: 'Settings' }).waitFor({ state: 'visible' });
  }

  /** Update the full name field and save. */
  async updateFullName(newName: string) {
    await this.fullNameInput.fill(newName);
    await this.saveButton.click();
  }

  /** Update the email field and save. */
  async updateEmail(newEmail: string) {
    await this.emailInput.fill(newEmail);
    await this.saveButton.click();
  }

  /** Click the toggle button matching a preference label text. */
  async togglePreference(label: string) {
    await this.page
      .locator('label')
      .filter({ hasText: label })
      .getByRole('button')
      .click();
  }
}
