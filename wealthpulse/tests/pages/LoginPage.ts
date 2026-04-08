import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:5173');
  }

  async login(username: string, password: string) {
    await this.page.getByPlaceholder('demo').fill(username);
    await this.page.getByPlaceholder('demo123').fill(password);
    await this.page.getByRole('button', { name: 'Sign In' }).click();
  }

  async loginAsDemo() {
    await this.login('demo', 'demo123');
  }
}
