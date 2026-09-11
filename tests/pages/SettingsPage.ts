import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Settings tab.
 * Covers profile editing (name, email, currency) and the save confirmation,
 * as well as preference toggle switches.
 */
export class SettingsPage {
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;

  constructor(private page: Page) {
    this.heading           = page.getByRole('heading', { name: 'Settings' });
    // Profile form fields, matched by their visible labels
    this.nameInput         = page.getByLabel('Full Name');
    this.emailInput        = page.getByLabel('Email');
    this.currencySelect    = page.getByLabel('Currency');
    this.saveButton        = page.getByRole('button', { name: /save changes/i });
    // The button text changes to "✓ Saved!" for ~2 s after a successful save
    this.savedConfirmation = page.getByRole('button', { name: /saved!/i });
  }

  /** Navigate to the Settings tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /**
   * Update the user's display name.
   * Clears the existing value before typing the new one.
   */
  async setName(newName: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(newName);
  }

  /**
   * Update the user's email address.
   */
  async setEmail(newEmail: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(newEmail);
  }

  /**
   * Select a currency option.
   * @param value Currency code: 'USD', 'EUR', or 'GBP'
   */
  async selectCurrency(value: 'USD' | 'EUR' | 'GBP') {
    await this.currencySelect.selectOption(value);
  }

  /** Click the Save Changes button to persist profile updates. */
  async save() {
    await this.saveButton.click();
  }
}
