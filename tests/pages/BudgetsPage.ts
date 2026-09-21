import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Budgets section.
 *
 * Covers: KPI cards (Total Budget, Total Spent, Remaining), inline
 * budget-limit spinbuttons per category, category search input, and
 * the month selector.
 */
export class BudgetsPage {
  /** The three KPI stat card label locators */
  readonly totalBudgetCard: Locator;
  readonly totalSpentCard: Locator;
  readonly remainingCard: Locator;

  /** Category search input */
  readonly searchInput: Locator;

  constructor(private page: Page) {
    this.totalBudgetCard = page.getByText('Total Budget');
    this.totalSpentCard  = page.getByText('Total Spent');
    this.remainingCard   = page.getByText('Remaining');
    this.searchInput     = page.getByPlaceholder(/search categories/i);
  }

  /** Navigate to the Budgets section from anywhere in the authenticated app. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
    await this.page.getByRole('heading', { name: 'Budgets' }).waitFor({ state: 'visible' });
  }

  /** Click a month button by label. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /**
   * Read a KPI dollar value by card label (e.g. 'Remaining').
   * Returns the first $-formatted text found inside that card's parent.
   */
  async getKpiValue(label: string): Promise<number> {
    const raw = await this.page
      .getByText(label)
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();
    return parseFloat((raw ?? '0').replace(/[$,]/g, ''));
  }

  /**
   * Read the inline budget spinbutton value for the given category.
   */
  async getBudgetInputValue(category: string): Promise<number> {
    const val = await this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .getByRole('spinbutton')
      .inputValue();
    return parseFloat(val);
  }

  /**
   * Set the inline budget spinbutton for a category to a new value.
   * Triggers React's onChange via fill + input event.
   */
  async setBudgetLimit(category: string, amount: number) {
    const input = this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .getByRole('spinbutton');
    await input.fill(String(amount));
    await input.dispatchEvent('input');
  }
}
