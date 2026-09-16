import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — page object for the Budgets tab.
 * Covers: month switching, category search, editing a budget limit, and KPI cards.
 */
export class BudgetsPage {
  /** Search input for filtering categories */
  readonly searchInput: Locator;

  /** KPI stat cards */
  readonly kpiTotalBudget: Locator;
  readonly kpiTotalSpent: Locator;
  readonly kpiRemaining: Locator;

  /** Budget category cards grid */
  readonly categoryCards: Locator;

  constructor(private page: Page) {
    this.searchInput = page.getByPlaceholder('Search categories…');

    this.kpiTotalBudget = page.getByText('Total Budget');
    this.kpiTotalSpent  = page.getByText('Total Spent');
    this.kpiRemaining   = page.getByText('Remaining').first();

    this.categoryCards = page.locator('[class*="rounded-2xl"]').filter({ hasText: /Budget:/ });
  }

  /** Navigate to the Budgets tab via the sidebar */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  /** Click a month selector button by short name */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).first().click();
  }

  /** Type into the category search box */
  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Set a new budget limit for a specific category.
   * Clears the existing value and fills in the new one, then blurs.
   */
  async setBudgetLimit(category: string, amount: number) {
    const card = this.page.locator('[class*="rounded-2xl"]').filter({ hasText: category }).first();
    const input = card.locator('input[type="number"]');
    await input.clear();
    await input.fill(String(amount));
    await input.press('Tab'); // commit the change
  }

  /**
   * Read the displayed dollar value of a KPI card by label.
   */
  async getKpiValue(label: string): Promise<string> {
    const text = await this.page
      .getByText(label)
      .locator('..')
      .locator('p.text-xl')
      .textContent();
    return text?.trim() ?? '';
  }

  /**
   * Read the budget input value for a specific category.
   */
  async getBudgetInputValue(category: string): Promise<string> {
    const card = this.page.locator('[class*="rounded-2xl"]').filter({ hasText: category }).first();
    return card.locator('input[type="number"]').inputValue();
  }
}
