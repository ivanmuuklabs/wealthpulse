import { Page, Locator } from '@playwright/test';

export class SettingsPage {
  readonly heading: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly profileAvatarInitials: Locator;
  readonly profileNameDisplay: Locator;
  readonly profileEmailDisplay: Locator;

  constructor(private page: Page) {
    this.heading              = page.locator('h2', { hasText: 'Settings' });
    this.fullNameInput        = page.locator('input[type="text"]').first();
    this.emailInput           = page.locator('input[type="email"]').first();
    this.currencySelect       = page.locator('select').last();
    this.saveButton           = page.getByRole('button', { name: /Save Changes|✓ Saved!/ });
    // Avatar inside the profile card (the initials tile)
    this.profileAvatarInitials = page.locator('div.w-16.h-16');
    // Name and email displayed in the profile summary (not editable fields)
    this.profileNameDisplay   = page.locator('p.text-white.font-semibold').first();
    this.profileEmailDisplay  = page.locator('p.text-xs.text-slate-500').first();
  }

  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  async updateProfile(name: string, email: string, currency?: string) {
    await this.fullNameInput.fill(name);
    await this.emailInput.fill(email);
    if (currency) {
      await this.currencySelect.selectOption(currency);
    }
    await this.saveButton.click();
  }

  /**
   * Returns a preference toggle locator by its label text.
   * (e.g. "Dark Mode", "Email Notifications", "Monthly Reports")
   */
  getPreferenceToggle(label: string): Locator {
    return this.page
      .locator('label', { hasText: label })
      .locator('div[class*="rounded-full"]');
  }

  /** Returns true if the save confirmation "Saved!" text is visible. */
  async isSavedConfirmationVisible(): Promise<boolean> {
    return this.page.getByRole('button', { name: '✓ Saved!' }).isVisible();
  }
}
