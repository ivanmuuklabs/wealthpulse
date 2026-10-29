import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — encapsulates selectors and actions for the Settings section.
 * Covers profile editing (name, email, currency), the Save Changes confirmation,
 * and the three preference toggles (Dark Mode, Email Notifications, Monthly Reports).
 */
export class SettingsPage {
  // Profile form fields
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;

  // Preference toggles (located by their visible label)
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;

  constructor(private page: Page) {
    this.fullNameInput = page.getByLabel(/full name/i);
    this.emailInput    = page.getByLabel(/email/i);
    this.currencySelect = page.getByLabel(/currency/i);
    this.saveButton    = page.getByRole('button', { name: /save changes/i });

    this.darkModeToggle            = page.getByText('Dark Mode').locator('..').getByRole('checkbox');
    this.emailNotificationsToggle  = page.getByText('Email Notifications').locator('..').getByRole('checkbox');
    this.monthlyReportsToggle      = page.getByText('Monthly Reports').locator('..').getByRole('checkbox');
  }

  /** Navigate to the Settings section via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /**
   * Update the Full Name field and save the profile.
   * After clicking "Save Changes", the button text briefly changes to "Saved!".
   */
  async saveProfile(name: string, email?: string, currency?: string) {
    await this.fullNameInput.fill(name);
    if (email)    await this.emailInput.fill(email);
    if (currency) await this.currencySelect.selectOption(currency);
    await this.saveButton.click();
  }

  /** Click a named preference toggle. */
  async togglePreference(name: 'Dark Mode' | 'Email Notifications' | 'Monthly Reports') {
    const toggles: Record<string, Locator> = {
      'Dark Mode':            this.darkModeToggle,
      'Email Notifications':  this.emailNotificationsToggle,
      'Monthly Reports':      this.monthlyReportsToggle,
    };
    await toggles[name].click();
  }
}
