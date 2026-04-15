import { Page, Locator } from '@playwright/test';

export class BudgetsPage {
  readonly budgetCards: Locator;
  readonly searchInput: Locator;
  readonly totalSpentStat: Locator;

  constructor(private page: Page) {
    // All visible budget cards (each contains "of $" in the subtitle)
    this.budgetCards = page.locator('.grid > div').filter({ hasText: /of \$/ });
    this.searchInput = page.getByPlaceholder('Search categories…');
    this.totalSpentStat = page.getByText('Total Spent').locator('..');
  }

  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  async clearSearch() {
    await this.searchInput.clear();
  }

  async setBudgetForCategory(category: string, amount: number) {
    const card = this.page.locator('div').filter({ hasText: new RegExp(`^${category}$`, 'i') }).locator('..').locator('..');
    const input = card.locator('input[type="number"]');
    await input.clear();
    await input.fill(String(amount));
    await input.press('Tab');
  }

  async getProgressBarClass(category: string): Promise<string> {
    const card = this.page
      .locator('div')
      .filter({ hasText: new RegExp(category, 'i') })
      .filter({ hasText: /of \$/ })
      .first();
    const bar = card.locator('div.h-full.rounded-full').first();
    return await bar.getAttribute('class') ?? '';
  }

  getCategoryCard(category: string): Locator {
    return this.page
      .locator('div')
      .filter({ hasText: new RegExp(category, 'i') })
      .filter({ hasText: /of \$/ })
      .first();
  }
}
