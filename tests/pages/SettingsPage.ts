import { Page, Locator } from '@playwright/test';

/**
 * SettingsPage — encapsulates all selectors and actions for the Settings tab.
 *
 * The Settings tab provides:
 *  - Profile Information form (name, email, currency) with a Save Changes button
 *  - Preferences section with toggle switches (Dark Mode, Email Notifications, Monthly Reports)
 */
export class SettingsPage {
  // ── Navigation ───────────────────────────────────────────
  readonly navButton: Locator;

  // ── Profile form ──────────────────────────────────────────
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;

  // ── Avatar initials in the profile card ──────────────────
  readonly avatarInCard: Locator;

  // ── Preferences toggles ───────────────────────────────────
  // Each preference row is a <label> containing the label text and a toggle button
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;

  constructor(private page: Page) {
    // Navigation (sidebar button)
    this.navButton = page.getByRole('button', { name: /settings/i });

    // Profile form fields
    this.nameInput = page.locator('label', { hasText: 'Full Name' }).locator('..').locator('input');
    this.emailInput = page.locator('label', { hasText: 'Email' }).locator('..').locator('input[type="email"]');
    this.currencySelect = page.locator('label', { hasText: 'Currency' }).locator('..').locator('select');
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved/i });

    // Avatar shown inside the profile card (text e.g. "AM")
    this.avatarInCard = page.locator('.rounded-2xl.bg-gradient-to-br.from-emerald-500.to-teal-600').first();

    // Preference toggle buttons (inside the Preferences card)
    this.darkModeToggle = page
      .locator('label', { hasText: 'Dark Mode' })
      .getByRole('button');
    this.emailNotificationsToggle = page
      .locator('label', { hasText: 'Email Notifications' })
      .getByRole('button');
    this.monthlyReportsToggle = page
      .locator('label', { hasText: 'Monthly Reports' })
      .getByRole('button');
  }

  /** Navigate to the Settings tab. */
  async navigate() {
    await this.navButton.click();
  }

  /**
   * Fill profile fields and click Save Changes.
   * Pass only the fields you want to change.
   */
  async saveProfile(opts: { name?: string; email?: string; currency?: 'USD' | 'EUR' | 'GBP' }) {
    if (opts.name !== undefined) {
      await this.nameInput.fill(opts.name);
    }
    if (opts.email !== undefined) {
      await this.emailInput.fill(opts.email);
    }
    if (opts.currency !== undefined) {
      await this.currencySelect.selectOption(opts.currency);
    }
    await this.saveButton.click();
  }
}
