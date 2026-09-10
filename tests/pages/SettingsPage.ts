import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 *
 * Features covered:
 *   - Profile Information card: Full Name, Email, Currency, Save Changes button
 *   - Success confirmation text ("✓ Saved!")
 *   - Preferences card: toggle switches for Dark Mode, Email Notifications, Monthly Reports
 */
export class SettingsPage {
  readonly heading: Locator;

  // Profile inputs
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;

  // Preference toggle labels (click the label to toggle the switch)
  readonly darkModeToggleLabel: Locator;
  readonly emailNotificationsToggleLabel: Locator;
  readonly monthlyReportsToggleLabel: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });

    this.fullNameInput   = page.getByLabel('Full Name');
    this.emailInput      = page.getByLabel('Email');
    this.currencySelect  = page.getByLabel('Currency');
    this.saveButton      = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByText('✓ Saved!');

    this.darkModeToggleLabel             = page.locator('label').filter({ hasText: 'Dark Mode' });
    this.emailNotificationsToggleLabel   = page.locator('label').filter({ hasText: 'Email Notifications' });
    this.monthlyReportsToggleLabel       = page.locator('label').filter({ hasText: 'Monthly Reports' });
  }

  /** Navigate to the Settings tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  /**
   * Update the profile name and/or email, then click Save Changes.
   * Pass only the fields you want to change.
   */
  async saveProfile({ name, email, currency }: { name?: string; email?: string; currency?: string }) {
    if (name !== undefined) {
      await this.fullNameInput.click({ clickCount: 3 });
      await this.fullNameInput.fill(name);
    }
    if (email !== undefined) {
      await this.emailInput.click({ clickCount: 3 });
      await this.emailInput.fill(email);
    }
    if (currency !== undefined) {
      await this.currencySelect.selectOption(currency);
    }
    await this.saveButton.click();
  }

  /**
   * Click the toggle for a given preference.
   * The entire label row is clickable.
   */
  async togglePreference(preference: 'Dark Mode' | 'Email Notifications' | 'Monthly Reports') {
    const map = {
      'Dark Mode':              this.darkModeToggleLabel,
      'Email Notifications':    this.emailNotificationsToggleLabel,
      'Monthly Reports':        this.monthlyReportsToggleLabel,
    } as const;
    await map[preference].click();
  }
}
