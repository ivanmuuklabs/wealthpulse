import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage encapsulates selectors and interactions for the Settings module.
 * Covers: profile editing (name, email, currency), save confirmation,
 * and preference toggle switches.
 */
export class SettingsPage {
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;

  constructor(private page: Page) {
    this.fullNameInput  = page.getByLabel(/full name/i);
    this.emailInput     = page.getByLabel(/email/i);
    this.currencySelect = page.getByLabel(/currency/i);
    this.saveButton     = page.getByRole('button', { name: /save changes/i });

    // Preference toggles — identified by their adjacent label text
    this.darkModeToggle            = page.locator('label', { hasText: /dark mode/i }).locator('input[type="checkbox"], button[role="switch"]').first();
    this.emailNotificationsToggle  = page.locator('label', { hasText: /email notifications/i }).locator('input[type="checkbox"], button[role="switch"]').first();
    this.monthlyReportsToggle      = page.locator('label', { hasText: /monthly reports/i }).locator('input[type="checkbox"], button[role="switch"]').first();
  }

  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /** Fill the Full Name field. */
  async setFullName(name: string) {
    await this.fullNameInput.fill(name);
  }

  /** Click Save Changes and wait for the button to confirm "Saved!" briefly. */
  async saveProfile() {
    await this.saveButton.click();
  }

  /** Read the current value of the Full Name field. */
  async getFullName(): Promise<string> {
    return this.fullNameInput.inputValue();
  }
}
