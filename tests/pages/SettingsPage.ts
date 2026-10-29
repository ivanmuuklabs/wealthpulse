import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 *
 * Covers:
 * - Profile form (Full Name, Email, Currency inputs)
 * - "Save Changes" / "✓ Saved!" button
 * - Preferences toggles (Dark Mode, Email Notifications, Monthly Reports)
 */
export class SettingsPage {
  /** Full Name text input */
  readonly nameInput: Locator;

  /** Email text input */
  readonly emailInput: Locator;

  /** Currency select dropdown */
  readonly currencySelect: Locator;

  /** "Save Changes" / "✓ Saved!" button */
  readonly saveButton: Locator;

  /** The success confirmation state of the save button */
  readonly savedConfirmation: Locator;

  /** Profile Information card heading */
  readonly profileHeading: Locator;

  /** Preferences section heading */
  readonly preferencesHeading: Locator;

  constructor(private page: Page) {
    // Locate by label text since these inputs have no placeholder
    this.nameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved/i });
    this.profileHeading = page.getByText('Profile Information');
    this.preferencesHeading = page.getByText('Preferences');
  }

  /** Navigate to the Settings module via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
    await this.page.getByRole('heading', { name: 'Settings' }).waitFor();
  }

  /**
   * Update the Full Name field and save.
   * @param newName New display name to set
   */
  async updateName(newName: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(newName);
    await this.saveButton.click();
  }

  /**
   * Update the Email field and save.
   * @param newEmail New email address
   */
  async updateEmail(newEmail: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(newEmail);
    await this.saveButton.click();
  }

  /**
   * Change the preferred currency and save.
   * @param currencyCode e.g. 'EUR', 'GBP', 'USD'
   */
  async updateCurrency(currencyCode: string) {
    await this.currencySelect.selectOption(currencyCode);
    await this.saveButton.click();
  }

  /**
   * Click a preferences toggle by its label text.
   * @param label e.g. 'Email Notifications', 'Monthly Reports'
   */
  async togglePreference(label: string) {
    await this.page.getByText(label).click();
  }
}
