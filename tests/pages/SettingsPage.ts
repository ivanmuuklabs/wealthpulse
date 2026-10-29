import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage
 *
 * Encapsulates locators and helpers for the Settings tab.
 * The Settings tab is reached by clicking the user avatar button in the
 * top-right corner, or via the sidebar "Settings" nav item.
 */
export class SettingsPage {
  readonly heading: Locator;

  // Profile card (avatar initials preview)
  readonly avatarInitials: Locator;
  readonly profileDisplayName: Locator;
  readonly profileDisplayEmail: Locator;

  // Form inputs
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;

  // Save button — toggles to "✓ Saved!" for 2 s after click
  readonly saveButton: Locator;

  // Preference toggles (by visible label text)
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' }).first();

    // Avatar inside the profile card (not the top-bar button)
    // The avatar is the first gradient square inside the Settings card area
    this.avatarInitials = page
      .locator('.max-w-2xl .rounded-2xl .rounded-2xl')
      .first();

    // Profile display (name and email shown above the form)
    this.profileDisplayName = page
      .locator('.max-w-2xl .rounded-2xl')
      .first()
      .locator('p.text-white.font-semibold');
    this.profileDisplayEmail = page
      .locator('.max-w-2xl .rounded-2xl')
      .first()
      .locator('p.text-xs.text-slate-500');

    // Form inputs — identified by their visible labels
    this.fullNameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');

    // Save / saved button
    this.saveButton = page.getByRole('button', { name: /save changes|✓ saved!/i });

    // Preference toggle buttons (by row text)
    this.darkModeToggle = page
      .getByText('Dark Mode')
      .locator('..')
      .locator('..')
      .getByRole('button');
    this.emailNotificationsToggle = page
      .getByText('Email Notifications')
      .locator('..')
      .locator('..')
      .getByRole('button');
    this.monthlyReportsToggle = page
      .getByText('Monthly Reports')
      .locator('..')
      .locator('..')
      .getByRole('button');
  }

  /** Navigate to the Settings tab via the sidebar nav item. */
  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /**
   * Update the full name field and save.
   * Returns after the "✓ Saved!" confirmation becomes visible.
   */
  async updateName(newName: string) {
    await this.fullNameInput.fill(newName);
    await this.saveButton.click();
    await this.page
      .getByRole('button', { name: /✓ saved!/i })
      .waitFor({ state: 'visible' });
  }

  /** Update the email field and save. */
  async updateEmail(newEmail: string) {
    await this.emailInput.fill(newEmail);
    await this.saveButton.click();
    await this.page
      .getByRole('button', { name: /✓ saved!/i })
      .waitFor({ state: 'visible' });
  }
}
