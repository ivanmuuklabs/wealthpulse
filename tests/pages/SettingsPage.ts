import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 *
 * Covers:
 *  - Profile form (Full Name, Email, Currency)
 *  - Save Changes button and the "✓ Saved!" confirmation
 *  - Preferences toggle switches (Dark Mode, Email Notifications, Monthly Reports)
 */
export class SettingsPage {
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;

  // Preference toggles — identified by their adjacent label text
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;

  constructor(private page: Page) {
    this.heading           = page.getByRole('heading', { name: 'Settings' });

    // Profile form inputs
    this.nameInput         = page.getByLabel('Full Name');
    this.emailInput        = page.getByLabel('Email');
    this.currencySelect    = page.getByLabel('Currency');
    this.saveButton        = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved/i });

    // Preference toggles: each <label> wraps a <button> for the toggle switch.
    this.darkModeToggle             = page.getByText('Dark Mode').locator('..').getByRole('button');
    this.emailNotificationsToggle   = page.getByText('Email Notifications').locator('..').getByRole('button');
    this.monthlyReportsToggle       = page.getByText('Monthly Reports').locator('..').getByRole('button');
  }

  /** Navigate to the Settings section via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Update the profile and click Save Changes. */
  async saveProfile(name: string, email: string, currency?: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    if (currency) {
      await this.currencySelect.selectOption(currency);
    }
    await this.saveButton.click();
  }

  /** Check whether a preference toggle is currently "on" (bg-emerald-500 class). */
  async isToggleOn(toggle: Locator): Promise<boolean> {
    const cls = await toggle.getAttribute('class') ?? '';
    return cls.includes('bg-emerald-500');
  }
}
