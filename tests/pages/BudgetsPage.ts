import { Page, Locator } from '@playwright/test';

export class BudgetsPage {
  readonly searchInput: Locator;
  readonly totalBudgetCard: Locator;
  readonly totalSpentCard: Locator;
  readonly remainingCard: Locator;
  readonly budgetCards: Locator;

  constructor(private page: Page) {
    // Search input for filtering budget categories by name
    this.searchInput = page.getByPlaceholder(/search/i);

    // KPI summary cards at the top — identified by their label headings
    this.totalBudgetCard = page.getByText('Total Budget').locator('..');
    this.totalSpentCard  = page.getByText('Total Spent').locator('..');
    this.remainingCard   = page.getByText('Remaining').locator('..');

    // Individual budget category cards — each contains the inline edit input
    this.budgetCards = page.locator('[class*="rounded"][class*="border"]').filter({
      has: page.locator('input[type="number"]'),
    });
  }

  /** Navigate to the Budgets tab via the sidebar */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  /** Click a month selector button */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /** Type into the category search box */
  async searchCategory(query: string) {
    await this.searchInput.fill(query);
  }

  /**
   * Set the inline budget limit for a category card by its visible name.
   * @param categoryName  Exact category label, e.g. 'Housing'
   * @param amount        New budget limit value
   */
  async setBudgetLimit(categoryName: string, amount: number) {
    const card = this.page.locator('div').filter({ hasText: new RegExp(`^${categoryName}`) }).first();
    const input = card.locator('input[type="number"]');
    await input.fill(String(amount));
    await input.dispatchEvent('input');
  }

  /**
   * Extract the numeric dollar value from a KPI card's primary value element.
   */
  async getKpiValue(card: Locator): Promise<number> {
    const text = await card
      .locator('text=/\\$[\\d,]+(\\.\\d+)?/')
      .first()
      .textContent();
    return parseFloat((text ?? '0').replace(/[$,]/g, ''));
  }
}
