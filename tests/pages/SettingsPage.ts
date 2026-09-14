import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 *
 * Covers:
 *  - Full Name / Email / Currency profile fields
 *  - Save Changes button and success confirmation
 *  - Preference toggle switches (Dark Mode, Email Notifications, Monthly Reports)
 */
export class SettingsPage {
  readonly heading: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });
    // Inputs are identified by their preceding label text
    this.fullNameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    // After saving, the button text changes to "✓ Saved!" for ~2 s
    this.savedConfirmation = page.getByRole('button', { name: /saved/i });
  }

  /** Navigate to the Settings tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Update the Full Name field. */
  async setFullName(name: string) {
    await this.fullNameInput.fill(name);
  }

  /** Update the Email field. */
  async setEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /** Select a currency option. */
  async setCurrency(currency: 'USD' | 'EUR' | 'GBP') {
    await this.currencySelect.selectOption(currency);
  }

  /** Click Save Changes and wait for the confirmation feedback. */
  async saveChanges() {
    await this.saveButton.click();
  }

  /**
   * Find the toggle switch for a named preference row and click it.
   * Preference names: 'Dark Mode', 'Email Notifications', 'Monthly Reports'
   */
  async togglePreference(label: string) {
    const row = this.page.locator('label').filter({ hasText: label });
    await row.locator('button').click();
  }

  /**
   * Returns true if the preference toggle is currently "on" (emerald background).
   */
  async isPreferenceOn(label: string): Promise<boolean> {
    const row = this.page.locator('label').filter({ hasText: label });
    const toggle = row.locator('button');
    const cls = await toggle.getAttribute('class');
    return cls?.includes('bg-emerald-500') ?? false;
  }
}
