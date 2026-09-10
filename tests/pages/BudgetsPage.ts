import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — page object for the Budgets tab.
 *
 * Features covered:
 *   - Month selector (Jan | Feb | Mar)
 *   - Category search filter
 *   - KPI overview: Total Budget, Total Spent, Remaining
 *   - Per-category budget cards with editable budget input
 */
export class BudgetsPage {
  readonly heading: Locator;
  readonly searchInput: Locator;

  // KPI stat card labels
  readonly totalBudgetLabel: Locator;
  readonly totalSpentLabel: Locator;
  readonly remainingLabel: Locator;

  // Month selector buttons
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  constructor(private page: Page) {
    this.heading     = page.getByRole('heading', { name: 'Budgets' });
    this.searchInput = page.getByPlaceholder('Search categories…');

    this.totalBudgetLabel = page.getByText('Total Budget').first();
    this.totalSpentLabel  = page.getByText('Total Spent').first();
    this.remainingLabel   = page.getByText('Remaining').first();

    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });
  }

  /** Navigate to the Budgets tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  /** Click a month button by 0-indexed month (0=Jan, 1=Feb, 2=Mar). */
  async selectMonth(month: 0 | 1 | 2) {
    const buttons = [this.janButton, this.febButton, this.marButton];
    await buttons[month].click();
  }

  /** Type in the category search box. */
  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Get the budget spinbutton (number input) for a specific category card.
   * The card text contains the category name.
   */
  getBudgetInput(category: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${category}`) })
      .getByRole('spinbutton')
      .first();
  }

  /**
   * Edit the budget limit for a category.
   * Clears the existing value and types the new one, then dispatches change.
   */
  async setBudgetLimit(category: string, amount: number) {
    const input = this.getBudgetInput(category);
    await input.click({ clickCount: 3 }); // select all
    await input.fill(String(amount));
    await input.press('Tab'); // commit change
  }

  /**
   * Read the displayed value text of a KPI stat card.
   * Returns the text of the bold value paragraph inside the card.
   */
  async getKpiValue(label: 'Total Budget' | 'Total Spent' | 'Remaining'): Promise<string | null> {
    return this.page
      .getByText(label)
      .first()
      .locator('..')   // parent div inside the card
      .locator('p')
      .nth(1)          // value paragraph
      .textContent();
  }
}
