import { Page, Locator } from '@playwright/test';

export class SettingsPage {
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;
  readonly avatarBadge: Locator;

  // Preference toggles
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;

  constructor(private page: Page) {
    this.fullNameInput = page.getByLabel(/full name/i);
    this.emailInput = page.getByLabel(/email/i);
    this.currencySelect = page.getByLabel(/currency/i);
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    // The button text changes to "Saved!" for 2 seconds after saving
    this.savedConfirmation = page.getByRole('button', { name: /saved!/i });

    // Avatar in the top-right header shows user initials
    this.avatarBadge = page.locator('header').getByText(/^[A-Z]{1,2}$/);

    // Toggles are checkbox inputs adjacent to their labels
    this.darkModeToggle = page.getByLabel(/dark mode/i);
    this.emailNotificationsToggle = page.getByLabel(/email notifications/i);
    this.monthlyReportsToggle = page.getByLabel(/monthly reports/i);
  }

  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  async editProfile(opts: { name?: string; email?: string; currency?: string }) {
    if (opts.name !== undefined) {
      await this.fullNameInput.clear();
      await this.fullNameInput.fill(opts.name);
    }
    if (opts.email !== undefined) {
      await this.emailInput.clear();
      await this.emailInput.fill(opts.email);
    }
    if (opts.currency !== undefined) {
      await this.currencySelect.selectOption(opts.currency);
    }
  }

  async saveProfile() {
    await this.saveButton.click();
  }
}
