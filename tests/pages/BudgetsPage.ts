import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — page object for the Budgets tab.
 *
 * Covers:
 *  - Month selector buttons
 *  - KPI cards (Total Budget, Total Spent, Remaining)
 *  - Category search input
 *  - Per-category budget cards and inline budget input
 */
export class BudgetsPage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly totalBudgetLabel: Locator;
  readonly totalSpentLabel: Locator;
  readonly remainingLabel: Locator;
  readonly budgetCards: Locator;

  constructor(private page: Page) {
    this.heading          = page.getByRole('heading', { name: 'Budgets' });
    this.searchInput      = page.getByPlaceholder('Search categories…');
    this.totalBudgetLabel = page.getByText('Total Budget');
    this.totalSpentLabel  = page.getByText('Total Spent').first();
    this.remainingLabel   = page.getByText('Remaining').first();
    // Each budget category card has the category name as a heading
    this.budgetCards      = page.locator('div[class*="rounded-2xl"]').filter({ hasText: /Budget:/ });
  }

  /** Navigate to the Budgets section via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Click a month selector button. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month, exact: true }).first().click();
  }

  /** Type in the category search box. */
  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Get the inline budget <input type="number"> for a specific category.
   * Each card has a label "Budget:" followed by a spinbutton.
   */
  getBudgetInputForCategory(category: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .filter({ has: this.page.getByRole('spinbutton') })
      .getByRole('spinbutton')
      .first();
  }

  /**
   * Read the displayed KPI value for a label.
   * StatCard renders: <label> → parent div → <p class="text-xl">.
   */
  async getKpiValue(label: 'Total Budget' | 'Total Spent' | 'Remaining'): Promise<string | null> {
    return this.page
      .getByText(label)
      .first()
      .locator('..')
      .locator('p.text-xl')
      .first()
      .textContent();
  }
}
