import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — page object for the Budgets tab.
 *
 * Covers: month selector, KPI cards (Total Budget / Total Spent /
 * Remaining), category search input, per-category budget spinbuttons,
 * and progress-bar cards.
 */
export class BudgetsPage {
  readonly budgetsHeading: Locator;
  readonly totalBudgetCard: Locator;
  readonly totalSpentCard: Locator;
  readonly remainingCard: Locator;
  readonly categorySearchInput: Locator;
  readonly categoryCards: Locator;
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  constructor(private page: Page) {
    this.budgetsHeading = page.getByRole('heading', { name: /budget/i }).first();

    // KPI stat cards
    this.totalBudgetCard = page.getByText('Total Budget');
    this.totalSpentCard = page.getByText('Total Spent');
    this.remainingCard = page.getByText('Remaining');

    // Category search
    this.categorySearchInput = page.getByPlaceholder('Search categories…');

    // Category budget cards — each contains a numeric input (spinbutton)
    this.categoryCards = page.locator('input[type="number"]');

    // Month buttons (shared with Dashboard)
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });
  }

  /** Navigate to Budgets tab from the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
    await this.totalBudgetCard.waitFor({ state: 'visible' });
  }

  /** Filter categories with the search input. */
  async searchCategory(term: string) {
    await this.categorySearchInput.fill(term);
  }

  /** Clear the category search input. */
  async clearSearch() {
    await this.categorySearchInput.clear();
  }

  /** Click a month button by name. */
  async selectMonth(name: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name }).click();
  }

  /**
   * Set a category's budget limit via its numeric spinbutton.
   * Finds the input inside a card that contains the category name.
   */
  async setBudgetLimit(category: string, amount: number) {
    const card = this.page
      .locator('.rounded-2xl')
      .filter({ hasText: category })
      .first();
    const input = card.locator('input[type="number"]');
    await input.triple_click?.() ?? await input.click({ clickCount: 3 });
    await input.fill(String(amount));
    await input.press('Tab'); // commit the value
  }

  /**
   * Read the raw text of a KPI card value.
   * Each KPI card is a glassmorphism Card with a label + value paragraph.
   */
  async getKpiValue(label: string): Promise<string> {
    const card = this.page
      .locator('.rounded-2xl')
      .filter({ hasText: label })
      .first();
    return card.locator('p.text-xl, p.text-2xl').first().innerText();
  }
}
