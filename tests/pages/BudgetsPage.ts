import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — page object for the Budgets tab.
 *
 * Covers: month selector, category search, inline budget-limit inputs,
 * and the KPI cards (Total Budget, Total Spent, Remaining).
 */
export class BudgetsPage {
  readonly searchInput: Locator;
  readonly budgetHeading: Locator;

  constructor(private page: Page) {
    this.searchInput  = page.getByPlaceholder('Search categories…');
    this.budgetHeading = page.getByRole('heading', { name: 'Budgets' });
  }

  /** Navigate to the Budgets tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
    await this.budgetHeading.waitFor({ state: 'visible' });
  }

  /** Click a month button by short name. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /** Type into the category search box. */
  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Get the budget spinbutton for a given category name.
   * Each category card contains an <input type="number"> labelled "Budget:".
   */
  getCategoryBudgetInput(category: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .getByRole('spinbutton')
      .first();
  }

  /**
   * Read the displayed KPI value for a given label
   * (e.g. 'Total Budget', 'Total Spent', 'Remaining').
   */
  async getKpiValue(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();
  }
}
