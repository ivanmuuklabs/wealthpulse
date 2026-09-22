import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the Settings tab of WealthPulse.
 *
 * Covers:
 *  - Navigating to the Settings section
 *  - Editing profile information (name, email, currency)
 *  - Saving changes and observing the confirmation state
 *  - Toggling preference switches
 */
export class SettingsPage {
  /** Sidebar button and avatar shortcut that both open Settings */
  readonly sidebarButton: Locator;

  /** Profile form fields */
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;

  /** Save Changes / "✓ Saved!" button */
  readonly saveButton: Locator;

  /** Profile avatar initials shown above the form */
  readonly avatarInitials: Locator;

  /** Preference toggles — indexed in DOM order:
   *  0 = Dark Mode, 1 = Email Notifications, 2 = Monthly Reports */
  readonly preferenceToggles: Locator;

  constructor(private page: Page) {
    this.sidebarButton = page.getByRole('button', { name: /settings/i });

    this.fullNameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');

    // The save button text cycles between "Save Changes" and "✓ Saved!"
    this.saveButton = page.getByRole('button', { name: /save changes|saved/i });

    // Avatar block inside the profile card
    this.avatarInitials = page.locator(
      'div.w-16.h-16.rounded-2xl.bg-gradient-to-br',
    );

    this.preferenceToggles = page.locator('button.w-10.h-5.rounded-full');
  }

  /** Navigate to Settings via the sidebar button */
  async navigate() {
    await this.sidebarButton.click();
    await this.page.getByRole('heading', { name: 'Settings' }).waitFor({ state: 'visible' });
  }

  /** Update the Full Name field */
  async setName(name: string) {
    await this.fullNameInput.clear();
    await this.fullNameInput.fill(name);
  }

  /** Update the Email field */
  async setEmail(email: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  /** Select a currency by its option value ("USD" | "EUR" | "GBP") */
  async setCurrency(currency: 'USD' | 'EUR' | 'GBP') {
    await this.currencySelect.selectOption(currency);
  }

  /** Click "Save Changes" and wait for the confirmation state */
  async saveChanges() {
    await this.saveButton.click();
  }

  /** Click a preference toggle by its 0-based index */
  async togglePreference(index: number) {
    await this.preferenceToggles.nth(index).click();
  }
}
