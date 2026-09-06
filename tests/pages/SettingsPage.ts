import { Page, Locator } from '@playwright/test';

export class SettingsPage {
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;
  /** Avatar initials badge shown in the profile summary at the top of Settings. */
  readonly avatarInitials: Locator;

  constructor(private page: Page) {
    this.fullNameInput            = page.getByLabel('Full Name');
    this.emailInput               = page.getByLabel('Email');
    this.currencySelect           = page.getByLabel('Currency');
    this.saveButton               = page.getByRole('button', { name: /save changes/i });
    // Button briefly changes to "Saved!" after a successful save
    this.savedConfirmation        = page.getByRole('button', { name: /saved!/i });

    // Preference toggles — located by their visible label text
    this.darkModeToggle           = page.getByLabel('Dark Mode');
    this.emailNotificationsToggle = page.getByLabel('Email Notifications');
    this.monthlyReportsToggle     = page.getByLabel('Monthly Reports');

    // Avatar initials are the two-letter badge derived from the user's full name
    this.avatarInitials           = page.locator('[aria-label="User avatar"], .avatar-initials').first();
  }

  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /** Update the full name field and save. */
  async updateFullName(name: string) {
    await this.fullNameInput.clear();
    await this.fullNameInput.fill(name);
    await this.saveButton.click();
  }
}
