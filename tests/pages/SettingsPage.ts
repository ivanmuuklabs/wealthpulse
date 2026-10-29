import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 *
 * Encapsulates all locators and helpers for the profile form (name, email,
 * currency), the save button, the "✓ Saved!" flash confirmation, and the
 * preference toggle switches.
 */
export class SettingsPage {
  readonly heading: Locator;

  // Profile form fields
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;

  // Save button and confirmation message
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;

  // Avatar in the profile card (shows name initials)
  readonly profileAvatar: Locator;

  // Top-bar avatar button (navigates to Settings)
  readonly topBarAvatarButton: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });

    // Full Name input — identified by its label
    this.nameInput     = page.getByLabel('Full Name');
    this.emailInput    = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');

    this.saveButton         = page.getByRole('button', { name: /Save Changes|✓ Saved!/i });
    this.savedConfirmation  = page.getByRole('button', { name: '✓ Saved!' });

    // The 2-letter initials avatar inside the Settings profile card
    this.profileAvatar     = page.locator('.rounded-2xl.bg-gradient-to-br').first();

    // Top-bar avatar (9px rounded-xl avatar button in the header)
    this.topBarAvatarButton = page.locator('header button.rounded-xl');
  }

  /** Navigate to Settings via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /** Navigate to Settings by clicking the top-bar avatar button. */
  async navigateViaTopBar() {
    await this.topBarAvatarButton.click();
  }

  /** Update the Full Name field and save. */
  async updateName(name: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
    await this.saveButton.click();
  }

  /** Update the Email field and save. */
  async updateEmail(email: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
    await this.saveButton.click();
  }

  /** Select a currency from the dropdown and save. */
  async updateCurrency(currency: 'USD' | 'EUR' | 'GBP') {
    await this.currencySelect.selectOption(currency);
    await this.saveButton.click();
  }

  /**
   * Click the toggle for a given preference label
   * (e.g. 'Dark Mode', 'Email Notifications', 'Monthly Reports').
   */
  async clickPreferenceToggle(label: string) {
    await this.page
      .locator('label', { hasText: label })
      .locator('button')
      .click();
  }
}
