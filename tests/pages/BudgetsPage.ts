import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — page object for the Budgets tab.
 *
 * Key features:
 * - Month switching (Jan / Feb / Mar)
 * - KPI cards: Total Budget, Total Spent, Remaining
 * - Per-category budget input (inline spinbutton)
 * - Search filter for categories
 */
export class BudgetsPage {
  readonly navButton: Locator;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly monthButtons: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /budgets/i });
    this.heading = page.getByRole('heading', { name: 'Budgets' });
    this.searchInput = page.getByPlaceholder('Search categories…');
    this.monthButtons = page.getByRole('button', { name: /^(Jan|Feb|Mar)$/ });
  }

  async navigate() {
    await this.navButton.click();
    await this.heading.waitFor({ state: 'visible' });
  }

  async selectMonth(index: 0 | 1 | 2) {
    await this.monthButtons.nth(index).click();
  }

  /** Return the current value of the inline budget input for `category`. */
  async getBudgetInputValue(category: string): Promise<string> {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .getByRole('spinbutton')
      .inputValue();
  }

  /** Set a new budget limit for `category`. */
  async setBudgetLimit(category: string, amount: string) {
    const input = this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .getByRole('spinbutton');
    await input.fill(amount);
    // Trigger change event so React state updates
    await input.press('Tab');
  }

  /** Return text content of a KPI card value (e.g. "Total Budget"). */
  async getKpiValue(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .locator('p.text-xl')
      .textContent();
  }
}
