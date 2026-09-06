import { Page, Locator } from '@playwright/test';

export class BudgetsPage {
  readonly searchInput: Locator;
  readonly totalBudgetCard: Locator;
  readonly totalSpentCard: Locator;
  readonly remainingCard: Locator;

  constructor(private page: Page) {
    this.searchInput    = page.getByPlaceholder('Search categories…');
    this.totalBudgetCard = page.getByText('Total Budget').locator('..');
    this.totalSpentCard  = page.getByText('Total Spent').locator('..');
    this.remainingCard   = page.getByText('Remaining').locator('..');
  }

  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }

  /** Returns the inline budget spinbutton for a given category name. */
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
      .locator('[role="progressbar"], .h-2, .h-3')
      .first();
  }

  /** Returns the full KPI dollar value from a KPI card locator. */
  async getKpiValue(card: Locator): Promise<string> {
    return (await card.locator('text=/\\$[\\d,]+/').first().textContent()) ?? '';
  }
}
