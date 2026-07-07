import { Page, expect } from '@playwright/test';

export class CandyMapperPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('https://candymapper.com');
  }

  async closeModal() {
    const closeBtn = this.page.getByRole('button', { name: 'X' });
    await closeBtn.waitFor({ state: 'visible' });
    await closeBtn.click();
    await expect(closeBtn).not.toBeVisible();
  }

  async fillName(name: string) {
    await this.page.getByLabel('Name').fill(name);
  }

  async fillEmail(email: string) {
    await this.page.getByLabel('Email').fill(email);
  }

  async clickSubmit() {
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }
}
