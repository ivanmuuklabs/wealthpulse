import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;

  constructor(private page: Page) {
    // exact: true prevents 'demo' matching 'demo123' — the bug this PR fixes
    this.usernameInput = page.getByPlaceholder('demo', { exact: true });
    this.passwordInput = page.getByPlaceholder('demo123', { exact: true });
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.errorMessage = page.getByText('Invalid credentials. Use demo / demo123');
  }

  async goto() {
    await this.page.goto('http://localhost:5173');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async loginAsDemo() {
    await this.login('demo', 'demo123');
  }

  /** Fill credentials and submit via Enter key on the password field */
  async loginViaEnterKey(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.passwordInput.press('Enter');
  }
}
