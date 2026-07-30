import { Page, Locator } from '@playwright/test';

export class SettingsPage {
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;
  readonly avatarInitials: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' }).or(
      page.locator('h2').filter({ hasText: 'Settings' })
    );
    this.nameInput = page.locator('input').filter({ has: page.locator(':scope') }).nth(0);
    // Use label text to scope inputs robustly
    this.nameInput = page.locator('label').filter({ hasText: /full name/i }).locator('..').locator('input');
    this.emailInput = page.locator('label').filter({ hasText: /email/i }).locator('..').locator('input');
    this.currencySelect = page.locator('label').filter({ hasText: /currency/i }).locator('..').locator('select');
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.savedConfirmation = page.getByRole('button', { name: /✓ saved!/i });
    // Avatar initials in the top-right header button
    this.avatarInitials = page.locator('header button').first();
  }

  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  async updateName(name: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async updateEmail(email: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  async selectCurrency(value: 'USD' | 'EUR' | 'GBP') {
    await this.currencySelect.selectOption(value);
  }

  async saveProfile() {
    await this.saveButton.click();
  }
}
