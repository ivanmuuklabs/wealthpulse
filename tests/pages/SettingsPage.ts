import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Settings tab.
 * Covers the Profile Information form (name, email, currency) and
 * the Preferences toggle-switch panel.
 */
export class SettingsPage {
  /** "Settings" heading */
  readonly heading: Locator;

  /** Profile form fields */
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;

  /** Save Changes / ✓ Saved! button */
  readonly saveButton: Locator;

  /** Success confirmation text shown for ~2 s after a successful save */
  readonly savedConfirmation: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });
    // Inputs are unlabelled at the HTML level; target by their section label text
    this.fullNameInput = page.locator('label', { hasText: /full name/i }).locator('..').locator('input');
    this.emailInput = page.locator('label', { hasText: /^email$/i }).locator('..').locator('input');
    this.currencySelect = page.locator('label', { hasText: /currency/i }).locator('..').locator('select');
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved!/i });
  }

  /** Navigate to the Settings tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /**
   * Fill in the Full Name field, clear first to replace any existing value.
   */
  async setFullName(name: string) {
    await this.fullNameInput.clear();
    await this.fullNameInput.fill(name);
  }

  /**
   * Fill in the Email field.
   */
  async setEmail(email: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  /**
   * Select a currency by its value ('USD' | 'EUR' | 'GBP').
   */
  async setCurrency(currency: 'USD' | 'EUR' | 'GBP') {
    await this.currencySelect.selectOption(currency);
  }

  /**
   * Click the Save Changes button and wait for the transient ✓ Saved! confirmation.
   */
  async saveChanges() {
    await this.saveButton.click();
    await this.savedConfirmation.waitFor({ state: 'visible' });
  }

  /**
   * Return the toggle button for a Preferences row by label text.
   * Each row is a <label> element wrapping the text and the toggle button.
   */
  toggleFor(label: string): Locator {
    return this.page
      .locator('label', { hasText: label })
      .locator('button');
  }
}
