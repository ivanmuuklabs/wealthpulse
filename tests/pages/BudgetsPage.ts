import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage
 *
 * Encapsulates locators and helpers for the Budgets tab.
 */
export class BudgetsPage {
  readonly heading: Locator;

  // Month selector
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // KPI summary cards
  readonly totalBudgetCard: Locator;
  readonly totalSpentCard: Locator;
  readonly remainingCard: Locator;

  // Category search
  readonly searchInput: Locator;

  // Budget category cards — each one contains an inline budget input
  readonly categoryCards: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: /budget/i }).first();

    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    this.totalBudgetCard = page.locator('div', { hasText: 'Total Budget' }).first();
    this.totalSpentCard = page.locator('div', { hasText: 'Total Spent' }).first();
    this.remainingCard = page.locator('div', { hasText: 'Remaining' }).first();

    this.searchInput = page.getByPlaceholder(/search/i);

    // Each category card is identified by the presence of a spinbutton (inline budget input)
    this.categoryCards = page.locator('div').filter({ has: page.getByRole('spinbutton') });
  }

  /** Navigate to the Budgets tab via the sidebar nav item. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Switch the active month. */
  async switchMonth(month: 'Jan' | 'Feb' | 'Mar') {
    const btn =
      month === 'Jan' ? this.janButton : month === 'Feb' ? this.febButton : this.marButton;
    await btn.click();
  }

  /** Read the inline budget amount for a specific category card (0-indexed). */
  async getBudgetInputValue(index: number): Promise<string> {
    return this.categoryCards.nth(index).getByRole('spinbutton').inputValue();
  }

  /** Update the inline budget limit for a specific category card (0-indexed). */
  async setBudgetLimit(index: number, amount: number) {
    const input = this.categoryCards.nth(index).getByRole('spinbutton');
    await input.fill(String(amount));
    await input.dispatchEvent('input');
  }

  /** Type in the category search box. */
  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Read the dollar value displayed in a KPI card.
   * Returns the raw text (e.g. "$4,200.00").
   */
  async kpiValue(cardLocator: Locator): Promise<string> {
    return (
      (await cardLocator.locator('text=/\\$[\\d,]+(\\.\\d+)?/').first().textContent()) ?? ''
    );
  }
}
