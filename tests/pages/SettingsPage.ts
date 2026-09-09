import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 *
 * Key features:
 * - Profile Information form: Full Name, Email, Currency, Save Changes
 * - Preferences toggles: Dark Mode, Email Notifications, Monthly Reports
 * - "✓ Saved!" transient confirmation after saving
 */
export class SettingsPage {
  readonly navButton: Locator;
  readonly heading: Locator;
  /** Full Name text input */
  readonly fullNameInput: Locator;
  /** Email text input */
  readonly emailInput: Locator;
  /** Currency select */
  readonly currencySelect: Locator;
  /** Save Changes button */
  readonly saveButton: Locator;
  /** Transient "✓ Saved!" confirmation that appears after saving */
  readonly savedConfirmation: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /settings/i });
    this.heading = page.getByRole('heading', { name: 'Settings' });
    // Inputs are identified by their visible labels
    this.fullNameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByText('✓ Saved!');
  }

  async navigate() {
    await this.navButton.click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Fill the profile form and click Save Changes */
  async saveProfile(name: string, email: string, currency?: string) {
    await this.fullNameInput.fill(name);
    await this.emailInput.fill(email);
    if (currency) {
      await this.currencySelect.selectOption(currency);
    }
    await this.saveButton.click();
  }
}
