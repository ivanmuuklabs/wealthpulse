import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — encapsulates selectors and actions for the Budgets section.
 *
 * The Budgets tab shows:
 *  - 3 KPI cards: Total Budget, Total Spent, Remaining
 *  - A category search input
 *  - 8 budget cards (one per spending category), each with a progress bar and an
 *    inline number input that lets the user edit the budget limit
 *  - A month selector (shared MonthButton component: Jan / Feb / Mar)
 */
export class BudgetsPage {
  // ── Navigation ─────────────────────────────────────────────────────────────

  /** Page heading */
  readonly heading: Locator;

  // ── KPI stat cards ──────────────────────────────────────────────────────────

  /** "Total Budget" KPI card text node */
  readonly totalBudgetLabel: Locator;

  /** "Total Spent" KPI card text node */
  readonly totalSpentLabel: Locator;

  /** "Remaining" KPI card text node */
  readonly remainingLabel: Locator;

  // ── Category search ─────────────────────────────────────────────────────────

  /** Search input that filters the category cards */
  readonly categorySearch: Locator;

  // ── Month selector ──────────────────────────────────────────────────────────

  readonly monthJan: Locator;
  readonly monthFeb: Locator;
  readonly monthMar: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: /budgets/i });

    this.totalBudgetLabel = page.getByText('Total Budget');
    this.totalSpentLabel  = page.getByText('Total Spent');
    this.remainingLabel   = page.getByText('Remaining');

    this.categorySearch = page.getByPlaceholder(/search categories/i);

    this.monthJan = page.getByRole('button', { name: 'Jan' });
    this.monthFeb = page.getByRole('button', { name: 'Feb' });
    this.monthMar = page.getByRole('button', { name: 'Mar' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  /** Navigate to the Budgets section via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  /** Switch to the given month using the month selector. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    const buttons: Record<string, Locator> = {
      Jan: this.monthJan,
      Feb: this.monthFeb,
      Mar: this.monthMar,
    };
    await buttons[month].click();
  }

  /** Type into the category search box. Pass an empty string to clear. */
  async searchCategory(term: string) {
    await this.categorySearch.fill(term);
  }

  /**
   * Return all visible budget category cards.
   * Each card contains the category name as visible text.
   */
  categoryCards(): Locator {
    // Each budget card is a Card component wrapping a category name and progress bar.
    // We identify cards by their progress-bar element which is always present.
    return this.page.locator('[class*="rounded-full"][class*="bg-white"]').locator('..');
  }

  /**
   * Return the inline budget number input for `category`.
   * The app renders one <input type="number"> per category card.
   */
  budgetInput(category: string): Locator {
    // Locate the card by category text, then find the number input inside it.
    return this.page
      .getByText(category, { exact: true })
      .locator('../..') // Card root
      .getByRole('spinbutton');
  }

  /**
   * Set the budget limit for `category` to `amount` by clearing the input and typing.
   */
  async setBudget(category: string, amount: number) {
    const input = this.budgetInput(category);
    await input.fill(String(amount));
    // Trigger the onChange handler by pressing Tab
    await input.press('Tab');
  }

  /**
   * Read the dollar amount displayed in the KPI card whose label matches `label`.
   * Returns the raw text of the first `$…` token found adjacent to that label.
   */
  async readKpiAmount(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();
  }
}
