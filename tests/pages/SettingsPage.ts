import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — page object for the Settings tab.
 *
 * Covers:
 *  - Navigation (sidebar and top-bar avatar)
 *  - Profile form fields (Full Name, Email, Currency)
 *  - Save Changes button and "✓ Saved!" confirmation
 *  - Profile card display (displayed name + avatar initials)
 *  - Preference toggle switches
 */
export class SettingsPage {
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;
  readonly profileCardName: Locator;
  readonly avatarInitials: Locator;
  readonly topBarAvatar: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });
    // Label-bound inputs
    this.nameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    this.currencySelect = page.getByLabel('Currency');
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved!/i });
    // Profile card — the displayed name and avatar sit in the profile card area
    this.profileCardName = page
      .locator('div.flex.items-center.gap-4')
      .locator('p.text-white.font-semibold')
      .first();
    this.avatarInitials = page
      .locator('div.w-16.h-16')
      .filter({ has: page.locator('text=/^[A-Z]{1,2}$/') })
      .first();
    // Top-bar avatar button navigates to Settings
    this.topBarAvatar = page.locator('header button').filter({ has: page.locator('text=/^[A-Z]{1,2}$/') });
  }

  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  async navigateViaTopBarAvatar() {
    await this.topBarAvatar.click();
  }

  async updateProfile(name?: string, email?: string, currency?: string) {
    if (name !== undefined) {
      await this.nameInput.clear();
      await this.nameInput.fill(name);
    }
    if (email !== undefined) {
      await this.emailInput.clear();
      await this.emailInput.fill(email);
    }
    if (currency !== undefined) {
      await this.currencySelect.selectOption(currency);
    }
    await this.saveButton.click();
  }

  /** Return the text content of the in-card avatar initials element. */
  async getAvatarInitials(): Promise<string | null> {
    return this.avatarInitials.textContent();
  }
}
