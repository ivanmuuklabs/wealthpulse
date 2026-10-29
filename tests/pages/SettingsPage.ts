import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Settings tab.
 * Covers profile-information form (name, email, currency) and
 * the preference toggles.
 */
export class SettingsPage {
  /** "Full Name" text input */
  readonly nameInput: Locator;
  /** "Email" input */
  readonly emailInput: Locator;
  /** "Currency" select */
  readonly currencySelect: Locator;
  /** "Save Changes" / "✓ Saved!" button */
  readonly saveButton: Locator;
  /** Success confirmation text shown briefly after save */
  readonly savedConfirmation: Locator;
  /** Preference toggle for "Email Notifications" */
  readonly emailNotificationsToggle: Locator;
  /** Preference toggle for "Monthly Reports" */
  readonly monthlyReportsToggle: Locator;

  constructor(private page: Page) {
    this.nameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved/i });
    // Preference toggles — identified by the surrounding label text
    this.emailNotificationsToggle = page
      .getByText('Email Notifications')
      .locator('..')
      .getByRole('button');
    this.monthlyReportsToggle = page
      .getByText('Monthly Reports')
      .locator('..')
      .getByRole('button');
  }

  /** Navigate to the Settings tab via the sidebar */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /** Fill and save the profile form */
  async saveProfile(name: string, email: string, currency: string = 'USD') {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
    await this.emailInput.clear();
    await this.emailInput.fill(email);
    await this.currencySelect.selectOption(currency);
    await this.saveButton.click();
  }
}
