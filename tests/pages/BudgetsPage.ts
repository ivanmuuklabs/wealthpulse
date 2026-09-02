import { Page, Locator } from '@playwright/test';

export class BudgetsPage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;
  readonly totalBudgetCard: Locator;
  readonly totalSpentCard: Locator;
  readonly remainingCard: Locator;

  constructor(private page: Page) {
    this.heading        = page.locator('h2', { hasText: 'Budgets' });
    this.searchInput    = page.getByPlaceholder('Search categories…');
    this.janButton      = page.getByRole('button', { name: 'Jan' });
    this.febButton      = page.getByRole('button', { name: 'Feb' });
    this.marButton      = page.getByRole('button', { name: 'Mar' });
    this.totalBudgetCard = page.getByText('Total Budget');
    this.totalSpentCard  = page.getByText('Total Spent').first();
    this.remainingCard   = page.getByText('Remaining').first();
  }

  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    const btn = { Jan: this.janButton, Feb: this.febButton, Mar: this.marButton }[month];
    await btn.click();
  }

  async searchCategories(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Returns the budget input locator for a specific category (e.g. "Housing").
   */
  getBudgetInput(category: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .getByRole('spinbutton')
      .first();
  }

  /**
   * Returns the percentage label text for a specific category card.
   */
  async getCategoryPercentage(category: string): Promise<string | null> {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .locator('span.text-lg.font-bold')
      .first()
      .textContent();
  }

  /**
   * Returns the remaining/over label text for a specific category.
   */
  async getCategoryRemainingLabel(category: string): Promise<string | null> {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .locator('span.text-xs.ml-auto')
      .first()
      .textContent();
  }

  /** Lists all visible category card titles. */
  async getVisibleCategoryNames(): Promise<string[]> {
    const els = this.page.locator('p.text-white.font-semibold.text-sm');
    return els.allTextContents();
  }
}
