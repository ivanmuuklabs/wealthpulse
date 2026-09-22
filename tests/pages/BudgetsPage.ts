import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — page object for the Budgets tab.
 *
 * Encapsulates locators and interactions for:
 *   - Overview KPI cards (Total Budget, Total Spent, Remaining)
 *   - Category search input
 *   - Per-category budget cards (progress bar, spend label, inline limit input)
 *   - Month selector buttons (shared with other tabs via the global MonthButton component)
 */
export class BudgetsPage {
  readonly heading: Locator;
  readonly searchInput: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Budgets' });

    // Category search uses the shared SearchInput component
    this.searchInput = page.getByPlaceholder('Search categories…');
  }

  /** Navigate to the Budgets tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /**
   * Read the text content of a KPI card (Total Budget, Total Spent, Remaining).
   * Returns the dollar-value string rendered inside the card, e.g. "$4,350.00".
   */
  async getKpiValue(label: 'Total Budget' | 'Total Spent' | 'Remaining'): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .locator('p.text-xl')
      .first()
      .textContent();
  }

  /**
   * Get the budget-limit spinbutton input for a given category card.
   * The category name appears as text inside the card that wraps the input.
   */
  categoryBudgetInput(category: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .getByRole('spinbutton')
      .first();
  }

  /**
   * Update the budget limit for a category by clearing and filling the spinbutton.
   * Tabs away to trigger the onChange event.
   */
  async setBudgetLimit(category: string, newLimit: number) {
    const input = this.categoryBudgetInput(category);
    await input.clear();
    await input.fill(String(newLimit));
    await input.press('Tab'); // trigger React onChange
  }

  /** Click a month selector button (Jan / Feb / Mar). */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /** Type in the category search field. */
  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }

  /** Clear the category search field. */
  async clearSearch() {
    await this.searchInput.clear();
  }
}
