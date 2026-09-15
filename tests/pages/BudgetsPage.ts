import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — page object for the Budgets tab.
 *
 * Covers the overview KPI cards (Total Budget, Total Spent, Remaining),
 * the category budget cards with inline-editable limits, and the
 * category search input.
 */
export class BudgetsPage {
  readonly heading: Locator;

  // Month selector
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // Overview KPI cards
  readonly totalBudgetCard: Locator;
  readonly totalSpentCard: Locator;
  readonly remainingCard: Locator;

  // Category search
  readonly searchInput: Locator;

  // Budget category cards (each contains the category name, progress bar, and inline input)
  readonly categoryCards: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Budgets' });

    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    // Overview stats (located by label text)
    this.totalBudgetCard = page.locator('p', { hasText: 'Total Budget' }).locator('..');
    this.totalSpentCard = page.locator('p', { hasText: 'Total Spent' }).locator('..');
    this.remainingCard = page.locator('p', { hasText: 'Remaining' }).locator('..');

    // The category search input (placeholder from SearchInput component)
    this.searchInput = page.getByPlaceholder('Search categories…');

    // Category cards contain "Expense Ratio"-free fund-like layout; filter by the inline budget input
    this.categoryCards = page.locator('div.rounded-2xl').filter({ has: page.locator('input[type="number"]') });
  }

  /** Navigate to the Budgets tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /**
   * Returns the budget card for a specific category name.
   * Useful for reading its progress percentage or editing the limit.
   */
  getCategoryCard(categoryName: string): Locator {
    return this.categoryCards.filter({ hasText: categoryName });
  }

  /**
   * Edit the budget limit for a given category via its inline number input.
   * Clears the current value and types the new amount.
   */
  async setBudgetLimit(categoryName: string, amount: number) {
    const card = this.getCategoryCard(categoryName);
    const input = card.getByRole('spinbutton');
    await input.clear();
    await input.fill(String(amount));
    // Trigger the onChange by pressing Tab (moves focus away, firing the event)
    await input.press('Tab');
  }

  /** Read the parsed numeric value of a KPI stat card by label. */
  async getKpiValue(label: 'Total Budget' | 'Total Spent' | 'Remaining'): Promise<number> {
    const card = this.page.locator('p', { hasText: label }).locator('..').locator('p.text-xl');
    const text = (await card.textContent() ?? '').replace(/[$,]/g, '');
    return parseFloat(text) || 0;
  }
}
