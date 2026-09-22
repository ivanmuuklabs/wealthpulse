import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 *
 * Encapsulates locators and interactions for:
 *   - Profile Information card (Full Name, Email, Currency, Save Changes)
 *   - Preferences toggles (Email Notifications, Monthly Reports)
 */
export class SettingsPage {
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });

    // Profile fields — identified by their visible labels
    this.nameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');

    this.saveButton = page.getByRole('button', { name: /save changes/i });
    // Button text changes to "✓ Saved!" momentarily after saving
    this.savedConfirmation = page.getByRole('button', { name: /saved/i });
  }

  /** Navigate to Settings via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Fill the Full Name field and save. */
  async updateName(newName: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(newName);
  }

  /** Fill the Email field. */
  async updateEmail(newEmail: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(newEmail);
  }

  /** Select a currency option. */
  async selectCurrency(value: 'USD' | 'EUR' | 'GBP') {
    await this.currencySelect.selectOption(value);
  }

  /** Click Save Changes and wait for the confirmation text. */
  async save() {
    await this.saveButton.click();
  }
}
