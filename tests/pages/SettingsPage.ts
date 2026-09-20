import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Settings tab.
 *
 * Covers: profile form (name, email, currency), save feedback,
 * and preference toggles.
 */
export class SettingsPage {
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;
  readonly avatarInitials: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });
    this.nameInput = page.locator('input').nth(0); // Full Name field
    this.emailInput = page.locator('input[type="email"]');
    this.currencySelect = page.locator('select').filter({ hasText: /USD|EUR|GBP/ });
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved/i });
    // Avatar shows initials derived from the name
    this.avatarInitials = page.locator(
      'div.w-16.h-16.rounded-2xl'
    );
    // Preference toggles — identified by their sibling label text
    this.emailNotificationsToggle = page
      .locator('label', { hasText: /email notifications/i })
      .locator('button');
    this.monthlyReportsToggle = page
      .locator('label', { hasText: /monthly reports/i })
      .locator('button');
  }

  /** Navigate to the Settings section from the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /** Fill and submit the profile form. */
  async updateProfile(name: string, email: string, currency: 'USD' | 'EUR' | 'GBP') {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.currencySelect.selectOption(currency);
    await this.saveButton.click();
  }
}
