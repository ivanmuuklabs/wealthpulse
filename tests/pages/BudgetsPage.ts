import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — page object for the Budgets tab.
 *
 * Covers the three KPI stat cards (Total Budget, Total Spent, Remaining),
 * the per-category budget cards with inline edit inputs and progress bars,
 * the category search input, and the month selector buttons.
 */
export class BudgetsPage {
  readonly navButton: Locator;

  // Header controls
  readonly searchInput: Locator;

  // Overview KPI cards
  readonly totalBudgetCard: Locator;
  readonly totalSpentCard: Locator;
  readonly remainingCard: Locator;

  // Category budget cards (the grid of per-category cards)
  readonly budgetCards: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /budgets/i });

    this.searchInput = page.getByPlaceholder('Search categories…');

    // KPI cards — each is identified by its label text
    this.totalBudgetCard = page.getByText('Total Budget').locator('..');
    this.totalSpentCard = page.getByText('Total Spent').locator('..');
    this.remainingCard = page.getByText('Remaining').locator('..');

    // Each category budget card contains "Expense Ratio" or a budget label.
    // They are the grid children inside the budgets section.
    this.budgetCards = page
      .locator('div.grid > div')
      .filter({ hasText: /Budget:/ });
  }

  /** Navigate to the Budgets tab from any authenticated view. */
  async navigate() {
    await this.navButton.click();
    await this.page.getByRole('heading', { name: 'Budgets' }).waitFor();
  }

  /**
   * Find the budget card for a specific category (e.g. "Housing").
   * Returns the scoped card Locator.
   */
  budgetCard(category: string): Locator {
    return this.page
      .locator('div.grid > div')
      .filter({ hasText: new RegExp(category) })
      .filter({ hasText: /Budget:/ })
      .first();
  }

  /**
   * Read the current numeric budget value from the inline spinner input
   * inside the card for the given category.
   */
  async getBudgetInputValue(category: string): Promise<number> {
    const card = this.budgetCard(category);
    const raw = await card.getByRole('spinbutton').inputValue();
    return parseFloat(raw);
  }

  /**
   * Edit the inline budget spinner for `category` to `amount`.
   * Clears the field, fills the new value, and dispatches a change event
   * so React's onChange fires.
   */
  async editBudget(category: string, amount: number) {
    const spinner = this.budgetCard(category).getByRole('spinbutton');
    await spinner.triple_click?.() ?? await spinner.click({ clickCount: 3 });
    await spinner.fill(String(amount));
    await spinner.dispatchEvent('change');
  }

  /** Type into the category search box. */
  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }
}
