import { Page, Locator } from '@playwright/test';

export class SettingsPage {
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveChangesButton: Locator;
  readonly savedConfirmation: Locator;
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;
  readonly avatarInitials: Locator;

  constructor(private page: Page) {
    this.fullNameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');
    this.saveChangesButton = page.getByRole('button', { name: /save changes/i });
    // The button text transitions to "Saved!" for 2 seconds after saving
    this.savedConfirmation = page.getByRole('button', { name: /saved!/i });
    // Preference toggles — identified by their label text sibling
    this.darkModeToggle = page
      .getByText('Dark Mode')
      .locator('..')
      .getByRole('checkbox');
    this.emailNotificationsToggle = page
      .getByText('Email Notifications')
      .locator('..')
      .getByRole('checkbox');
    this.monthlyReportsToggle = page
      .getByText('Monthly Reports')
      .locator('..')
      .getByRole('checkbox');
    // Avatar initials badge visible in the profile card
    this.avatarInitials = page.locator('[data-testid="avatar-initials"]');
  }

  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /** Fill the Full Name field, clear first to avoid appending */
  async setFullName(name: string) {
    await this.fullNameInput.clear();
    await this.fullNameInput.fill(name);
  }

  /** Fill the Email field */
  async setEmail(email: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  /** Save profile and wait for the confirmation flash */
  async saveProfile() {
    await this.saveChangesButton.click();
  }
}
