import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 *
 * Covers the Profile Information form (name, email, currency)
 * and the Save Changes / success confirmation flow.
 */
export class SettingsPage {
  readonly navButton: Locator;

  // Profile form
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;

  // Post-save confirmation text rendered on the button itself
  readonly savedConfirmation: Locator;

  // Avatar initials element (reflects saved name)
  readonly avatarInitials: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /settings/i });

    this.nameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved/i });

    // Avatar div showing the two-letter initials
    this.avatarInitials = page.locator('div.rounded-2xl').filter({ hasText: /^[A-Z]{1,2}$/ }).first();
  }

  /** Navigate to the Settings tab from any authenticated view. */
  async navigate() {
    await this.navButton.click();
    await this.page.getByRole('heading', { name: 'Settings' }).waitFor();
  }

  /**
   * Fill in the profile form and click Save.
   * Only the fields that are supplied will be changed.
   */
  async saveProfile(opts: {
    name?: string;
    email?: string;
    currency?: 'USD' | 'EUR' | 'GBP';
  }) {
    if (opts.name !== undefined) {
      await this.nameInput.clear();
      await this.nameInput.fill(opts.name);
    }
    if (opts.email !== undefined) {
      await this.emailInput.clear();
      await this.emailInput.fill(opts.email);
    }
    if (opts.currency !== undefined) {
      await this.currencySelect.selectOption(opts.currency);
    }
    await this.saveButton.click();
  }
}
