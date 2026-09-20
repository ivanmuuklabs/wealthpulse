import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Budgets tab.
 * Covers the KPI overview cards (Total Budget / Total Spent / Remaining),
 * the category search input, the month selector, and the per-category
 * budget-limit inline inputs.
 */
export class BudgetsPage {
  /** "Budgets" heading */
  readonly heading: Locator;

  /** Category search input */
  readonly searchInput: Locator;

  /** KPI stat card labels */
  readonly totalBudgetLabel: Locator;
  readonly totalSpentLabel: Locator;
  readonly remainingLabel: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Budgets' });
    this.searchInput = page.getByPlaceholder('Search categories…');
    this.totalBudgetLabel = page.getByText('Total Budget');
    this.totalSpentLabel = page.getByText('Total Spent');
    this.remainingLabel = page.getByText('Remaining');
  }

  /** Navigate to the Budgets tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Click a specific month button by short name. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /** Type into the category search box. */
  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Read the KPI value (bold currency text) shown beneath a stat-card label.
   * The StatCard renders label in a <p> and the value in a sibling <p.text-xl>.
   */
  async getKpiValue(label: string): Promise<string> {
    return (
      (await this.page
        .getByText(label)
        .locator('..')
        .locator('p.text-xl')
        .first()
        .textContent()) ?? ''
    );
  }

  /**
   * Return the inline budget number-input for a given category name.
   * Each category card contains a <input type="number"> with min=0.
   */
  budgetInputFor(category: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .filter({ has: this.page.locator('input[type="number"]') })
      .locator('input[type="number"]')
      .first();
  }

  /**
   * Update the budget limit for a category by clearing and re-filling its input.
   */
  async setBudgetLimit(category: string, amount: number) {
    const input = this.budgetInputFor(category);
    await input.fill(String(amount));
    // Trigger the React onChange by pressing Tab to move focus
    await input.press('Tab');
  }
}
