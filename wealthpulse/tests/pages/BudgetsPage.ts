import { Page, Locator } from '@playwright/test';

export class BudgetsPage {
  readonly heading: Locator;
  readonly totalBudgetCard: Locator;
  readonly totalSpentCard: Locator;
  readonly remainingCard: Locator;
  readonly categoryCards: Locator;
  readonly progressBars: Locator;
  readonly budgetInputs: Locator;
  readonly searchInput: Locator;
  readonly monthButtons: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Budgets' });
    this.totalBudgetCard = page.getByText('Total Budget');
    this.totalSpentCard = page.getByText('Total Spent');
    this.remainingCard = page.getByText('Remaining');
    // Each budget category card contains "of $" in the subtitle (e.g. "$284.59 of $2,000.00")
    this.categoryCards = page.locator('text=/of \\$/).locator('..');
    // Progress bar fill elements inside the budget cards
    this.progressBars = page
      .locator('.rounded-full.bg-white\\/\\[0\\.06\\] > div');
    this.budgetInputs = page.locator('input[type="number"]');
    this.searchInput = page.getByPlaceholder('Search categories…');
    this.monthButtons = page.locator('button', { hasText: /^(Jan|Feb|Mar)$/ });
  }

  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  async setBudgetForCategory(index: number, amount: number) {
    const input = this.budgetInputs.nth(index);
    await input.triple_click?.() ?? await input.click({ clickCount: 3 });
    await input.fill(String(amount));
    await input.press('Tab');
  }

  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }

  async getCategoryCardByName(name: string): Promise<Locator> {
    return this.page.locator(`text=${name}`).locator('..').locator('..');
  }
}
