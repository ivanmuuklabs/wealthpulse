import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — page object for the Budgets tab.
 *
 * Exposes locators and helpers for the budget KPI cards, category cards,
 * budget spinbuttons, progress bars, category search, and month selector.
 */
export class BudgetsPage {
  readonly heading: Locator;
  readonly searchInput: Locator;

  // KPI stat cards
  readonly totalBudgetCard: Locator;
  readonly totalSpentCard: Locator;
  readonly remainingCard: Locator;

  constructor(private page: Page) {
    this.heading     = page.getByRole('heading', { name: 'Budgets' });
    this.searchInput = page.getByPlaceholder('Search categories…');

    this.totalBudgetCard = page.getByText('Total Budget');
    this.totalSpentCard  = page.getByText('Total Spent');
    this.remainingCard   = page.getByText('Remaining');
  }

  /** Navigate to the Budgets section via the sidebar button. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  /** Click a month selector button (Jan / Feb / Mar). */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /** Type in the category search box. */
  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Get the budget spinbutton (number input) for a given category.
   * The input sits inside a card that contains the category name.
   */
  getBudgetInput(category: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .getByRole('spinbutton')
      .first();
  }

  /**
   * Update the budget limit for a given category.
   * Clears the input and types the new value.
   */
  async setBudgetLimit(category: string, amount: number) {
    const input = this.getBudgetInput(category);
    await input.clear();
    await input.fill(String(amount));
    await input.press('Tab'); // trigger change event
  }

  /**
   * Read the dollar-value from a KPI stat card by its label text.
   */
  async getKpiValue(label: string): Promise<string> {
    const value = await this.page
      .getByText(label)
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();
    return value ?? '';
  }

  /**
   * Get the "X left" or "X over" remaining label inside a category card.
   */
  getCategoryRemainingLabel(category: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .locator('text=/left|over/')
      .first();
  }
}
