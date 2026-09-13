import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Settings tab.
 *
 * Covers:
 *  - Navigating to the tab
 *  - Editing and saving user profile (name, email, currency)
 *  - Reading the success toast / confirmation
 */
export class SettingsPage {
  readonly navButton: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /settings/i });
    this.nameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');
    this.saveButton = page.getByRole('button', { name: /save/i });
    // The app briefly shows a "Saved!" confirmation after saving
    this.savedConfirmation = page.getByText('Saved!');
  }

  async navigate() {
    await this.navButton.click();
  }

  async updateName(name: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async updateEmail(email: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  async updateCurrency(currency: string) {
    await this.currencySelect.selectOption(currency);
  }

  async save() {
    await this.saveButton.click();
  }
}
