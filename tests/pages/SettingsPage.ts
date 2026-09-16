import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 * Covers: profile save flow and preference toggles.
 */
export class SettingsPage {
  /** Profile form inputs */
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;

  /** Save Changes / Saved! button */
  readonly saveButton: Locator;

  /** Preference toggle buttons (Dark Mode, Email Notifications, Monthly Reports) */
  readonly preferenceToggles: Locator;

  constructor(private page: Page) {
    this.nameInput      = page.getByLabel('Full Name', { exact: false });
    this.emailInput     = page.getByLabel('Email', { exact: false });
    this.currencySelect = page.getByLabel('Currency', { exact: false });
    this.saveButton     = page.getByRole('button', { name: /save changes|✓ saved!/i });
    this.preferenceToggles = page.locator('button[class*="rounded-full"]');
  }

  /** Navigate to the Settings tab via the sidebar */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /** Fill the full name field */
  async setName(name: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  /** Fill the email field */
  async setEmail(email: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  /** Select a currency */
  async setCurrency(currency: 'USD' | 'EUR' | 'GBP') {
    await this.currencySelect.selectOption(currency);
  }

  /** Click Save Changes */
  async save() {
    await this.saveButton.click();
  }

  /** Click the Nth preference toggle (0-based index) */
  async clickToggle(index: number) {
    await this.preferenceToggles.nth(index).click();
  }
}
