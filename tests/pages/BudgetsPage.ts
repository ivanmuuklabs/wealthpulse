import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage encapsulates selectors and interactions for the Budgets module.
 * Covers: month selection, category search, and inline budget limit editing.
 */
export class BudgetsPage {
  readonly searchInput: Locator;
  readonly totalBudgetKpi: Locator;
  readonly totalSpentKpi: Locator;
  readonly remainingKpi: Locator;
  readonly categoryCards: Locator;

  constructor(private page: Page) {
    this.searchInput    = page.getByPlaceholder(/search/i);
    this.totalBudgetKpi = page.getByText('Total Budget');
    this.totalSpentKpi  = page.getByText('Total Spent');
    this.remainingKpi   = page.getByText('Remaining');
    // Each category budget card contains the budget spinbutton
    this.categoryCards  = page.locator('div').filter({ has: page.locator('input[type="number"]') });
  }

  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /** Filter budget category cards by typing in the search input. */
  async searchCategories(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Update the budget limit for a specific category by its name.
   * Uses the spinbutton inside the card that contains the category label.
   */
  async setBudgetLimit(categoryName: string, amount: number) {
    const card = this.page.locator('div').filter({ hasText: new RegExp(`^${categoryName}`) }).first();
    const input = card.getByRole('spinbutton');
    await input.fill(String(amount));
    await input.dispatchEvent('input');
  }

  /** Returns the spinbutton value for a given category. */
  async getBudgetLimitValue(categoryName: string): Promise<string> {
    const card = this.page.locator('div').filter({ hasText: new RegExp(`^${categoryName}`) }).first();
    return card.getByRole('spinbutton').inputValue();
  }
}
