import { Page, Locator } from '@playwright/test';

export class SettingsPage {
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currencySelect: Locator;
  readonly saveButton: Locator;
  readonly savedConfirmation: Locator;
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly monthlyReportsToggle: Locator;
  readonly avatarHeader: Locator;

  constructor(private page: Page) {
    this.fullNameInput            = page.getByLabel('Full Name');
    this.emailInput               = page.getByLabel('Email');
    this.currencySelect           = page.getByLabel('Currency');
    this.saveButton               = page.getByRole('button', { name: 'Save Changes' });
    this.savedConfirmation        = page.getByRole('button', { name: 'Saved!' });
    this.darkModeToggle           = page.locator('label').filter({ hasText: 'Dark Mode' }).locator('input[type="checkbox"]');
    this.emailNotificationsToggle = page.locator('label').filter({ hasText: 'Email Notifications' }).locator('input[type="checkbox"]');
    this.monthlyReportsToggle     = page.locator('label').filter({ hasText: 'Monthly Reports' }).locator('input[type="checkbox"]');
    // Avatar badge in the top-right header
    this.avatarHeader = page.locator('header button').filter({ hasText: /^[A-Z]{1,2}$/ });
  }

  async navigate() {
    await this.page.getByRole('button', { name: /settings/i }).click();
  }

  async saveProfile() {
    await this.saveButton.click();
  }

  async updateFullName(name: string) {
    await this.fullNameInput.clear();
    await this.fullNameInput.fill(name);
  }

  async updateEmail(email: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  async selectCurrency(value: 'USD' | 'EUR' | 'GBP') {
    await this.currencySelect.selectOption(value);
  }
}
