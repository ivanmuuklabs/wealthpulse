import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — page object for the Budgets tab.
 *
 * Encapsulates locators and interactions for:
 * - The KPI stat cards (Total Budget, Total Spent, Remaining)
 * - Category budget cards with inline edit inputs
 * - The search input for filtering categories
 * - Month selector buttons
 */
export class BudgetsPage {
  /** "Total Budget" KPI value */
  readonly totalBudgetValue: Locator;

  /** "Total Spent" KPI value */
  readonly totalSpentValue: Locator;

  /** "Remaining" KPI value */
  readonly remainingValue: Locator;

  /** Search input for filtering budget categories */
  readonly searchInput: Locator;

  /** All budget category cards rendered in the grid */
  readonly budgetCards: Locator;

  constructor(private page: Page) {
    this.totalBudgetValue = page
      .getByText('Total Budget')
      .locator('..')
      .locator('p.text-xl');

    this.totalSpentValue = page
      .getByText('Total Spent')
      .locator('..')
      .locator('p.text-xl');

    this.remainingValue = page
      .getByText('Remaining')
      .locator('..')
      .locator('p.text-xl');

    this.searchInput = page.getByPlaceholder('Search categories…');

    // Each budget card contains the category name and a progress bar
    this.budgetCards = page.locator('div.grid').filter({ hasText: 'Housing' }).locator('> div');
  }

  /** Navigate to the Budgets module via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
    await this.page.getByRole('heading', { name: 'Budgets' }).waitFor();
  }

  /** Click a month button by abbreviated name. */
  async selectMonth(abbr: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: abbr }).click();
  }

  /**
   * Get the inline budget spinbutton for a given category.
   * @param category e.g. 'Housing', 'Food'
   */
  getBudgetInput(category: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .getByRole('spinbutton')
      .first();
  }

  /**
   * Update the budget limit for a specific category.
   * @param category Category name (e.g. 'Food')
   * @param amount   New budget amount as a number
   */
  async setBudgetLimit(category: string, amount: number) {
    const input = this.getBudgetInput(category);
    await input.clear();
    await input.fill(String(amount));
    await input.press('Tab'); // commit the change
  }

  /** Type in the search box to filter budget category cards. */
  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }
}
