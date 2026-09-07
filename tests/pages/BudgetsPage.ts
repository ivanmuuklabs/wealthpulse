import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the Budgets tab.
 * Covers: KPI cards (Total Budget, Total Spent, Remaining),
 * category budget cards, inline budget editing, and month selector.
 */
export class BudgetsPage {
  readonly heading: Locator;
  readonly totalBudgetCard: Locator;
  readonly totalSpentCard: Locator;
  readonly remainingCard: Locator;
  readonly searchInput: Locator;
  readonly budgetCards: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Budgets' });
    this.totalBudgetCard = page.getByText('Total Budget').locator('..');
    this.totalSpentCard = page.getByText('Total Spent').locator('..');
    this.remainingCard = page.getByText('Remaining').locator('..');
    this.searchInput = page.getByPlaceholder('Search categories…');
    // Budget category cards — each contains a progress bar and an edit input
    this.budgetCards = page.locator('div').filter({ hasText: /Housing|Food|Transport|Entertainment|Health|Utilities|Shopping|Subscriptions/ }).filter({ has: page.locator('input[type="number"]') });
  }

  /** Navigate to the Budgets section via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  /** Select a month tab (Jan, Feb, Mar). */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /** Search for a budget category. */
  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Set the budget limit for a given category by updating its inline number input.
   * The input is the spinbutton scoped within the card for that category.
   */
  async setBudgetLimit(category: string, amount: number) {
    const card = this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .filter({ has: this.page.locator('input[type="number"]') })
      .first();
    const input = card.getByRole('spinbutton');
    await input.fill(String(amount));
    // Trigger change event so React state updates
    await input.dispatchEvent('change');
  }

  /** Get the spinbutton (budget input) for a specific category. */
  getBudgetInput(category: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .filter({ has: this.page.locator('input[type="number"]') })
      .first()
      .getByRole('spinbutton');
  }
}
