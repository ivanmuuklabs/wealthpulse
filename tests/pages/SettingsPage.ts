import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Settings tab.
 *
 * Covers: profile name / email / currency fields and the Save button.
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

    // The Settings form uses labelled inputs — label text in the app is "Full Name"
    this.nameInput = page.getByLabel(/full name/i);
    this.emailInput = page.getByLabel(/email/i);
    this.currencySelect = page.getByLabel(/currency/i);
    this.saveButton = page.getByRole('button', { name: /save/i }).last();
    this.savedConfirmation = page.getByText(/saved|profile updated/i);
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

  async saveProfile() {
    await this.saveButton.click();
  }
}
