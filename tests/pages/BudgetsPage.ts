import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — page object for the Budgets tab.
 *
 * The Budgets tab contains:
 *  - A month-selector (Jan / Feb / Mar) — same MonthButton pattern as Dashboard
 *  - Three KPI StatCards: Total Budget, Total Spent, Remaining
 *  - A category search input
 *  - 8 category budget cards, each with a spinbutton to edit the limit inline
 */
export class BudgetsPage {
  /** Month selector buttons */
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  /** KPI labels */
  readonly totalBudgetLabel: Locator;
  readonly totalSpentLabel: Locator;
  readonly remainingLabel: Locator;

  /** Category search input */
  readonly categorySearch: Locator;

  /** Budgets page heading */
  readonly heading: Locator;

  constructor(private page: Page) {
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    this.totalBudgetLabel = page.getByText('Total Budget');
    this.totalSpentLabel  = page.getByText('Total Spent');
    this.remainingLabel   = page.getByText('Remaining');

    this.categorySearch = page.getByPlaceholder('Search categories…');

    this.heading = page.getByRole('heading', { name: 'Budgets' });
  }

  /** Navigate to the Budgets tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  /**
   * Get the spinbutton for a given budget category (e.g. "Housing").
   * The spinbutton is the inline numeric input used to edit the budget limit.
   */
  categorySpinbutton(category: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .getByRole('spinbutton')
      .first();
  }

  /**
   * Read a KPI dollar value by its label text.
   * Returns the trimmed text of the dollar-formatted sibling element.
   */
  async getKpiValue(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();
  }

  /** Type into the category search input. */
  async searchCategories(term: string) {
    await this.categorySearch.fill(term);
  }

  /** Clear the category search input. */
  async clearSearch() {
    await this.categorySearch.clear();
  }
}
