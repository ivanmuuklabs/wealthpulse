import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Settings tab.
 *
 * Covers:
 *  - Profile Information card: name, email, currency inputs, save button,
 *    "✓ Saved!" confirmation, avatar initials in top-bar.
 *  - Preferences card: Dark Mode, Email Notifications, Monthly Reports toggles.
 */
export class SettingsPage {
  readonly heading: Locator;
  readonly settingsNavButton: Locator;

  // Profile Information card
  readonly profileHeading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;
  /** Top-bar avatar button showing initials (e.g. "AM") */
  readonly topBarAvatar: Locator;

  // Preferences toggles (each is a <button> inside its <label> row)
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });
    this.settingsNavButton = page.getByRole('button', { name: 'Settings' });

    this.profileHeading = page.getByText('Profile Information');

    // Inputs identified by their sibling <label> text
    this.nameInput = page
      .locator('label')
      .filter({ hasText: /Full Name/i })
      .locator('..')
      .locator('input');
    this.emailInput = page
      .locator('label')
      .filter({ hasText: /^Email$/i })
      .locator('..')
      .locator('input');
    this.currencySelect = page.locator('select');

    // Save button text toggles between the two states
    this.saveButton = page.getByRole('button', { name: 'Save Changes' });
    this.savedConfirmation = page.getByRole('button', { name: '✓ Saved!' });

    // Top-bar avatar: button whose visible text is two uppercase initials
    this.topBarAvatar = page.locator('header button').filter({ hasText: /^[A-Z]{2}$/ });

    // Preference toggles — scoped to their <label> container
    this.darkModeToggle = page
      .locator('label')
      .filter({ hasText: /Dark Mode/ })
      .locator('button');
    this.emailNotificationsToggle = page
      .locator('label')
      .filter({ hasText: /Email Notifications/ })
      .locator('button');
    this.monthlyReportsToggle = page
      .locator('label')
      .filter({ hasText: /Monthly Reports/ })
      .locator('button');
  }

  /** Click the Settings nav item and wait for the heading. */
  async navigate() {
    await this.settingsNavButton.click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Replace the name field content and click Save Changes. */
  async updateName(newName: string) {
    await this.nameInput.click({ clickCount: 3 }); // select-all existing value
    await this.nameInput.fill(newName);
    await this.saveButton.click();
  }

  /** Replace the email field content and click Save Changes. */
  async updateEmail(newEmail: string) {
    await this.emailInput.click({ clickCount: 3 });
    await this.emailInput.fill(newEmail);
    await this.saveButton.click();
  }
}
