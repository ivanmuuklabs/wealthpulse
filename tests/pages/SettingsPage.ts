import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 *
 * Covers Profile Information (name, email, currency) and the
 * Preferences toggle panel.
 */
export class SettingsPage {
  readonly navButton: Locator;
  readonly heading: Locator;

  // Profile form
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /settings/i });
    this.heading = page.getByRole('heading', { name: 'Settings' });

    // The labels use uppercase tracking-widest — match by label text
    this.nameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved/i });
  }

  /** Navigate to the Settings section from within the app. */
  async navigate() {
    await this.navButton.click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Update the profile and submit. */
  async updateProfile(name: string, email: string, currency?: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    if (currency) {
      await this.currencySelect.selectOption(currency);
    }
    await this.saveButton.click();
  }
}
