import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 *
 * Covers: profile update (name, email, currency) and
 * the save confirmation feedback.
 */
export class SettingsPage {
  readonly heading: Locator;

  // Profile form
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;

  // Avatar / initials display
  readonly avatarInitials: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });

    // Inputs — identified by label text (uppercase tracking text above each field)
    this.nameInput = page.getByLabel('Full Name', { exact: false });
    this.emailInput = page.getByLabel('Email', { exact: false });
    this.currencySelect = page.getByLabel('Currency', { exact: false });

    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved/i });

    // Avatar element showing the user's initials
    this.avatarInitials = page.locator('div.from-emerald-500.to-teal-600').filter({ hasText: /^[A-Z]{1,2}$/ }).first();
  }

  /** Navigate to the Settings tab from any authenticated state */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Update the profile and click Save */
  async updateProfile(options: { name?: string; email?: string; currency?: string }) {
    if (options.name !== undefined) {
      await this.nameInput.triple_click?.() ?? await this.nameInput.click({ clickCount: 3 });
      await this.nameInput.fill(options.name);
    }
    if (options.email !== undefined) {
      await this.emailInput.click({ clickCount: 3 });
      await this.emailInput.fill(options.email);
    }
    if (options.currency !== undefined) {
      await this.currencySelect.selectOption(options.currency);
    }
    await this.saveButton.click();
  }
}
