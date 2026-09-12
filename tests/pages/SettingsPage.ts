import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 *
 * The Settings tab has two cards:
 *  1. Profile Information — Full Name, Email, Currency select, Save Changes button.
 *  2. Preferences — three toggle switches: Dark Mode, Email Notifications, Monthly Reports.
 *
 * Saving profile info triggers a "✓ Saved!" button text for ~2 seconds.
 */
export class SettingsPage {
  /** Profile card fields */
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;

  /** Success confirmation — button text changes to "✓ Saved!" after save */
  readonly savedConfirmation: Locator;

  /** Preferences section heading */
  readonly preferencesHeading: Locator;

  constructor(private page: Page) {
    // Profile inputs — identified by their visible labels
    this.nameInput     = page.getByLabel('Full Name');
    this.emailInput    = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');
    this.saveButton    = page.getByRole('button', { name: /save changes/i });

    // After saving, the button briefly reads "✓ Saved!"
    this.savedConfirmation = page.getByRole('button', { name: /saved/i });

    this.preferencesHeading = page.getByText('Preferences');
  }

  /** Navigate to the Settings tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /** Update the display name and save. */
  async updateName(newName: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(newName);
  }

  /** Update the email and save. */
  async updateEmail(newEmail: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(newEmail);
  }

  /** Click Save Changes. */
  async save() {
    await this.saveButton.click();
  }

  /**
   * Locate a preference toggle by its visible label text.
   * Returns the toggle <button> element.
   */
  preferenceToggle(label: string): Locator {
    return this.page
      .getByText(label)
      .locator('../..')
      .getByRole('button');
  }
}
