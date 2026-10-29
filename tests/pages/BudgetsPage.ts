import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — page object for the Budgets tab.
 *
 * Covers: month selector, KPI stat cards (Total Budget / Total Spent / Remaining),
 * category search, inline budget-limit editing, and category progress bars.
 */
export class BudgetsPage {
  // Month selector (shared MonthButton component)
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // KPI stat cards
  readonly totalBudgetCard: Locator;
  readonly totalSpentCard: Locator;
  readonly remainingCard: Locator;

  // Category search input
  readonly searchInput: Locator;

  constructor(private page: Page) {
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    this.totalBudgetCard = page.getByText('Total Budget').locator('..');
    this.totalSpentCard  = page.getByText('Total Spent').locator('..');
    this.remainingCard   = page.getByText('Remaining').locator('..');

    this.searchInput = page.getByPlaceholder('Search categories…');
  }

  /** Navigate to the Budgets tab from any authenticated state. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
    await this.page.getByRole('heading', { name: 'Budgets' }).waitFor({ state: 'visible' });
  }

  /** Click a month selector button. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    const buttons = { Jan: this.janButton, Feb: this.febButton, Mar: this.marButton };
    await buttons[month].first().click();
  }

  /** Returns the dollar value text from inside a KPI stat card. */
  async getKpiValue(card: Locator): Promise<string> {
    return (await card.locator('text=/\\$[\\d,]+/').first().textContent()) ?? '';
  }

  /**
   * Returns the inline budget spinbutton for a given category name.
   * Each category card has a `<input type="number">` for editing its limit.
   */
  categoryBudgetInput(categoryName: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${categoryName}`) })
      .getByRole('spinbutton')
      .first();
  }

  /** Returns the progress bar element inside a category card. */
  categoryProgressBar(categoryName: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${categoryName}`) })
      .locator('.h-2, [class*="h-full rounded-full"]')
      .first();
  }

  /** Filter the category list using the search input. */
  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }
}
