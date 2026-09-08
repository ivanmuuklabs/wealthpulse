import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Budgets tab.
 * Encapsulates selectors and interactions for KPI cards,
 * month switching, category search, and budget-limit editing.
 */
export class BudgetsPage {
  readonly heading: Locator;
  readonly searchInput: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Budgets' });
    this.searchInput = page.getByPlaceholder('Search categories…');
  }

  /** Navigate to the Budgets tab from within the app. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  /** Click a month button by its short name (Jan, Feb, Mar). */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /** Read the dollar value of a KPI card by its label (e.g. 'Total Spent'). */
  async getKpiValue(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();
  }

  /**
   * Get the budget-limit spinbutton for a specific category card.
   * The spinbutton is the number input inside the card that has the category label.
   */
  getBudgetInput(category: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .getByRole('spinbutton')
      .first();
  }

  /**
   * Get the percentage label displayed on the category card (e.g. "45%").
   * This is the bold coloured percentage that reflects spent/budget.
   */
  getCategoryPercentage(category: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .locator('span')
      .filter({ hasText: /\d+%/ })
      .first();
  }
}
