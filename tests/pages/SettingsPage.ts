import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the Settings tab.
 * Covers: profile info fields (name, email, currency) and the Save button.
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
    this.nameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    // Transient feedback shown after save
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved/i });
  }

  /** Navigate to the Settings section via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /** Update the full name field. */
  async setName(name: string) {
    await this.nameInput.fill(name);
  }

  /** Update the email field. */
  async setEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /** Update the currency dropdown. */
  async setCurrency(currency: 'USD' | 'EUR' | 'GBP') {
    await this.currencySelect.selectOption(currency);
  }

  /** Click Save and wait for the confirmation feedback. */
  async save() {
    await this.saveButton.click();
  }
}
