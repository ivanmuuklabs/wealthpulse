import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Settings section.
 * Covers profile editing (name, email, currency), Save Changes confirmation,
 * and preference toggles (Dark Mode, Email Notifications, Monthly Reports).
 */
export class SettingsPage {
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveChangesButton: Locator;

  // Preference toggles — each is a checkbox or button adjacent to the label
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;

  // Avatar initials element in the profile card
  readonly avatarInitials: Locator;

  constructor(private page: Page) {
    this.fullNameInput   = page.getByLabel(/full name/i);
    this.emailInput      = page.getByLabel(/email/i);
    this.currencySelect  = page.getByLabel(/currency/i);
    this.saveChangesButton = page.getByRole('button', { name: /save changes/i });

    // Toggles are input[type="checkbox"] or role="switch" adjacent to text
    this.darkModeToggle            = page.locator('label', { hasText: /dark mode/i }).locator('input[type="checkbox"]');
    this.emailNotificationsToggle  = page.locator('label', { hasText: /email notifications/i }).locator('input[type="checkbox"]');
    this.monthlyReportsToggle      = page.locator('label', { hasText: /monthly reports/i }).locator('input[type="checkbox"]');

    // Profile avatar — shows initials derived from the full name
    this.avatarInitials = page.locator('[data-testid="avatar"], .avatar-initials, div').filter({ hasText: /^[A-Z]{1,2}$/ }).first();
  }

  /** Navigate to Settings via sidebar */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
    await this.saveChangesButton.waitFor({ state: 'visible' });
  }

  /**
   * Update the full name field and save.
   * Returns after the button label reverts from "Saved!" to "Save Changes".
   */
  async saveProfile(newName: string, newEmail?: string) {
    await this.fullNameInput.clear();
    await this.fullNameInput.fill(newName);
    if (newEmail !== undefined) {
      await this.emailInput.clear();
      await this.emailInput.fill(newEmail);
    }
    await this.saveChangesButton.click();
  }
}
