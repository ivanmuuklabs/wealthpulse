import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — page object for the Budgets tab.
 *
 * Covers:
 *  - Navigation
 *  - Month selector (Jan / Feb / Mar)
 *  - KPI stat cards (Total Budget, Total Spent, Remaining)
 *  - Category search
 *  - Category budget cards and their inline edit inputs
 */
export class BudgetsPage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly totalBudgetLabel: Locator;
  readonly totalSpentLabel: Locator;
  readonly remainingLabel: Locator;

  /** All budget category cards — each shows the category name and "X% " badge */
  readonly categoryCards: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Budgets' });
    this.searchInput = page.getByPlaceholder('Search categories…');
    this.totalBudgetLabel = page.getByText('Total Budget');
    this.totalSpentLabel = page.getByText('Total Spent');
    this.remainingLabel = page.getByText('Remaining');

    // Each budget category card contains a spinbutton for the budget limit
    this.categoryCards = page.locator('div.grid > div').filter({
      has: page.locator('input[type="number"]'),
    });
  }

  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  async searchCategories(term: string) {
    await this.searchInput.fill(term);
  }

  /** Return the spinbutton locator for a given category name (e.g. "Housing"). */
  budgetInput(category: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .getByRole('spinbutton')
      .first();
  }

  /**
   * Read the numeric value displayed in a KPI stat card.
   * `label` should match one of: "Total Budget", "Total Spent", "Remaining".
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
}
