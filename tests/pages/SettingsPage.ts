import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 *
 * Covers: profile form (name, email, currency), Save Changes button,
 * "✓ Saved!" confirmation, avatar initials in the profile card,
 * top-bar avatar button, and preference toggle switches.
 */
export class SettingsPage {
  readonly settingsHeading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;
  readonly profileCardAvatar: Locator;
  readonly topBarAvatar: Locator;
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;

  constructor(private page: Page) {
    this.settingsHeading = page.getByRole('heading', { name: /settings/i }).first();

    // Profile form
    this.nameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');

    // Save / confirmation
    this.saveButton = page.getByRole('button', { name: /save changes|✓ saved/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved/i });

    // Avatar displayed in the profile card (below the heading)
    this.profileCardAvatar = page
      .locator('.rounded-2xl')
      .filter({ hasText: 'Profile Information' })
      .locator('div.rounded-2xl')
      .first();

    // Top-bar avatar button
    this.topBarAvatar = page.locator('header').getByRole('button');

    // Preference toggles (by label text)
    this.darkModeToggle = page
      .locator('label')
      .filter({ hasText: 'Dark Mode' })
      .locator('button');
    this.emailNotificationsToggle = page
      .locator('label')
      .filter({ hasText: 'Email Notifications' })
      .locator('button');
    this.monthlyReportsToggle = page
      .locator('label')
      .filter({ hasText: 'Monthly Reports' })
      .locator('button');
  }

  /** Navigate to the Settings tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
    await this.settingsHeading.waitFor({ state: 'visible' });
  }

  /** Navigate to Settings by clicking the top-bar avatar button. */
  async navigateViaTopBarAvatar() {
    await this.topBarAvatar.click();
    await this.settingsHeading.waitFor({ state: 'visible' });
  }

  /** Update the full name field. */
  async setName(name: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  /** Update the email field. */
  async setEmail(email: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  /** Select a currency from the dropdown ('USD' | 'EUR' | 'GBP'). */
  async setCurrency(currency: 'USD' | 'EUR' | 'GBP') {
    await this.currencySelect.selectOption(currency);
  }

  /** Click Save Changes and return the resulting button text. */
  async save() {
    await this.saveButton.click();
  }
}
