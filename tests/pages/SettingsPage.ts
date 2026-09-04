import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Settings tab.
 *
 * Covers the Profile Information form (name, email, currency) and the
 * Preferences toggle-switch list.
 */
export class SettingsPage {
  // Page heading
  readonly heading: Locator;

  // Profile form fields
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;

  // Save / confirmation button
  readonly saveButton: Locator;

  // Avatar initials shown in the profile card
  readonly avatarInitials: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });

    // Each field is labelled via an uppercase tracking-widest label element
    this.fullNameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');

    // The save button flips to "✓ Saved!" for 2 s after a successful save
    this.saveButton = page.getByRole('button', { name: /save changes|✓ saved/i });

    // Avatar initials (the two-letter badge derived from the user's name)
    this.avatarInitials = page.locator('div.w-16.h-16');
  }

  /** Navigate to the Settings tab via the sidebar. */
  async navigate(page: Page) {
    await page.getByRole('button', { name: /settings/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /**
   * Update the full name field and save the form.
   * @param newName  The new full name to enter
   */
  async updateFullName(newName: string) {
    await this.fullNameInput.fill(newName);
    await this.saveButton.click();
  }

  /**
   * Update the email field and save the form.
   * @param newEmail  The new email address to enter
   */
  async updateEmail(newEmail: string) {
    await this.emailInput.fill(newEmail);
    await this.saveButton.click();
  }
}
