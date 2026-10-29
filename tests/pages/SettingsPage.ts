import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Settings section.
 *
 * Covers: profile form (name, email, currency), Save Changes button,
 * and the three preference toggles (Dark Mode, Email Notifications,
 * Monthly Reports).
 */
export class SettingsPage {
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveChangesButton: Locator;

  /** Toggle for Dark Mode preference */
  readonly darkModeToggle: Locator;

  /** Toggle for Email Notifications preference */
  readonly emailNotificationsToggle: Locator;

  /** Toggle for Monthly Reports preference */
  readonly monthlyReportsToggle: Locator;

  /** Avatar / initials badge shown in the profile summary card */
  readonly avatarBadge: Locator;

  constructor(private page: Page) {
    this.fullNameInput  = page.getByLabel(/full name/i);
    this.emailInput     = page.getByLabel(/email/i);
    this.currencySelect = page.getByRole('combobox');

    this.saveChangesButton = page.getByRole('button', { name: /save changes/i });

    // Toggles — located by their accompanying label text
    this.darkModeToggle            = page.getByLabel(/dark mode/i);
    this.emailNotificationsToggle  = page.getByLabel(/email notifications/i);
    this.monthlyReportsToggle      = page.getByLabel(/monthly reports/i);

    // Avatar initials badge in the profile card
    this.avatarBadge = page.locator('[class*="rounded-full"]').filter({ hasText: /^[A-Z]{1,2}$/ }).first();
  }

  /** Navigate to Settings from anywhere in the authenticated app. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /** Save the profile form and wait for the confirmation label. */
  async saveProfile() {
    await this.saveChangesButton.click();
  }

  /** Click a preference toggle by aria-label text. */
  async clickToggle(name: 'Dark Mode' | 'Email Notifications' | 'Monthly Reports') {
    await this.page.getByLabel(name).click();
  }
}
