import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Settings tab.
 * Encapsulates selectors and interactions for profile editing
 * and preference toggles.
 */
export class SettingsPage {
  readonly heading: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });
    this.fullNameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    // The button text changes to "✓ Saved!" for 2 seconds after a successful save
    this.savedConfirmation = page.getByRole('button', { name: /saved/i });
  }

  /** Navigate to the Settings tab from within the app. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /** Update the full name field and save. */
  async updateName(name: string) {
    await this.fullNameInput.clear();
    await this.fullNameInput.fill(name);
    await this.saveButton.click();
  }

  /** Toggle the preference switch identified by its visible label text. */
  async togglePreference(label: string) {
    await this.page.getByText(label).locator('..').locator('button').click();
  }
}
