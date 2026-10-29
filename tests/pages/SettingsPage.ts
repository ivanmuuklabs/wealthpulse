import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the Settings tab.
 *
 * Covers: Profile Information form (name, email, currency) and the
 * Save Changes button / success confirmation.
 */
export class SettingsPage {
  // Sidebar navigation
  readonly sidebarButton: Locator;

  // Profile form fields
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;

  // Confirmation feedback after saving
  readonly savedConfirmation: Locator;

  // Avatar initials (derived from the saved name)
  readonly avatarInHeader: Locator;

  constructor(private page: Page) {
    this.sidebarButton = page.getByRole('button', { name: /settings/i });

    // Profile card inputs — scoped by label text to avoid ambiguity
    this.nameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');

    this.saveButton = page.getByRole('button', { name: /save changes/i });
    // After a successful save the button briefly shows "✓ Saved!"
    this.savedConfirmation = page.getByRole('button', { name: /saved!/i });

    // The top-right avatar shows the user's initials
    this.avatarInHeader = page.locator('header button').filter({ hasText: /^[A-Z]{2}$/ });
  }

  /** Navigate to the Settings tab via the sidebar. */
  async navigate() {
    await this.sidebarButton.click();
    await this.page.waitForSelector('h2:has-text("Settings")');
  }

  /** Update the Full Name field and save. */
  async updateName(newName: string) {
    await this.nameInput.fill(newName);
    await this.saveButton.click();
  }

  /** Update the Email field and save. */
  async updateEmail(newEmail: string) {
    await this.emailInput.fill(newEmail);
    await this.saveButton.click();
  }

  /** Change the currency selector and save. */
  async updateCurrency(currency: 'USD' | 'EUR' | 'GBP') {
    await this.currencySelect.selectOption(currency);
    await this.saveButton.click();
  }
}
