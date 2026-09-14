import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — page object for the Budgets tab.
 *
 * Covers:
 *  - Month selector
 *  - KPI cards (Total Budget, Total Spent, Remaining)
 *  - Category search
 *  - Per-category budget limit input
 */
export class BudgetsPage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly totalBudgetLabel: Locator;
  readonly totalSpentLabel: Locator;
  readonly remainingLabel: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Budgets' });
    this.searchInput = page.getByPlaceholder('Search categories…');
    this.totalBudgetLabel = page.getByText('Total Budget');
    this.totalSpentLabel = page.getByText('Total Spent').first();
    this.remainingLabel = page.getByText('Remaining').first();
  }

  /** Navigate to the Budgets tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Click a month tab by short name (Jan, Feb, Mar). */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).first().click();
  }

  /** Type into the category search box. */
  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Set the budget limit for a specific category.
   * Each category card has an <input type="number"> preceded by the label "Budget:".
   */
  async setBudgetLimit(category: string, amount: number) {
    const card = this.page.locator('div').filter({ hasText: new RegExp(`^${category}`) }).first();
    const input = card.getByRole('spinbutton');
    await input.fill(String(amount));
    await input.press('Tab');
  }

  /**
   * Returns the current budget spinbutton value for a given category.
   */
  async getBudgetLimit(category: string): Promise<string> {
    const card = this.page.locator('div').filter({ hasText: new RegExp(`^${category}`) }).first();
    return card.getByRole('spinbutton').inputValue();
  }

  /** Returns the text value of the given KPI card (Total Budget / Total Spent / Remaining). */
  async getKpiValue(label: 'Total Budget' | 'Total Spent' | 'Remaining'): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .locator('p.text-xl')
      .first()
      .textContent();
  }
}
