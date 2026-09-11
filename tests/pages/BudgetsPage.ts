import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Budgets tab.
 * Covers KPI cards, category budget cards, the inline budget limit
 * input, and the search/month-selector controls.
 */
export class BudgetsPage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly totalBudgetLabel: Locator;
  readonly totalSpentLabel: Locator;
  readonly remainingLabel: Locator;

  constructor(private page: Page) {
    this.heading          = page.getByRole('heading', { name: 'Budgets' });
    this.searchInput      = page.getByPlaceholder('Search categories…');
    this.totalBudgetLabel = page.getByText('Total Budget');
    this.totalSpentLabel  = page.getByText('Total Spent').first();
    this.remainingLabel   = page.getByText('Remaining').first();
  }

  /** Navigate to the Budgets tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  /** Click a month button within the Budgets month selector. */
  async selectMonth(shortName: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: shortName }).click();
  }

  /** Type a term into the category search box. */
  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Locate the budget spinbutton for the given category card and set a new limit.
   * The spinbutton sits inside a div whose text starts with the category name.
   */
  async setBudgetLimit(category: string, amount: number) {
    const card = this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .filter({ has: this.page.getByRole('spinbutton') });
    await card.getByRole('spinbutton').fill(String(amount));
    await card.getByRole('spinbutton').press('Tab'); // commit the change
  }

  /**
   * Read the spinbutton value for a given category.
   */
  async getBudgetLimit(category: string): Promise<string> {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .filter({ has: this.page.getByRole('spinbutton') })
      .getByRole('spinbutton')
      .inputValue();
  }

  /**
   * Read a KPI card value (Total Budget / Total Spent / Remaining).
   * Matches the first dollar amount in the parent of the label.
   */
  async getKpiValue(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .first()
      .locator('..')
      .locator('text=/\\$[\\d,]+/')
      .first()
      .textContent();
  }
}
