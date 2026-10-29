import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — encapsulates selectors and actions for the Budgets tab.
 *
 * The Budgets tab provides:
 *  - Three KPI cards: Total Budget, Total Spent, Remaining
 *  - A category search input to filter budget cards
 *  - A month selector (Jan / Feb / Mar) shared with other tabs
 *  - One card per category (8 by default) each with:
 *      - A progress bar showing % of budget used
 *      - An inline numeric input to edit the budget limit
 *      - A "X left" / "X over" label
 */
export class BudgetsPage {
  // ── Navigation ───────────────────────────────────────────
  readonly navButton: Locator;

  // ── Month selector ───────────────────────────────────────
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // ── KPI cards ────────────────────────────────────────────
  readonly totalBudgetLabel: Locator;
  readonly totalSpentLabel: Locator;
  readonly remainingLabel: Locator;

  // ── Category search ──────────────────────────────────────
  readonly searchInput: Locator;

  // ── Page heading ─────────────────────────────────────────
  readonly budgetsHeading: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /budgets/i });

    // Month buttons shared across tabs
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    // KPI labels — using exact match to avoid collision with other tabs
    this.totalBudgetLabel = page.getByText('Total Budget', { exact: true });
    this.totalSpentLabel  = page.getByText('Total Spent',  { exact: true });
    this.remainingLabel   = page.getByText('Remaining',    { exact: true });

    // Category search input (placeholder from App.jsx)
    this.searchInput = page.getByPlaceholder('Search categories…');

    this.budgetsHeading = page.getByRole('heading', { name: /budgets/i });
  }

  /** Navigate to the Budgets tab via the sidebar. */
  async navigate() {
    await this.navButton.click();
  }

  /** Click a month selector button. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    const btn =
      month === 'Jan' ? this.janButton :
      month === 'Feb' ? this.febButton :
      this.marButton;
    await btn.click();
  }

  /** Type into the category search input. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Returns all visible budget category cards.
   * Each card contains a number input for the budget limit.
   */
  categoryCardsByName(): Locator {
    return this.page.locator('.grid > div').filter({
      has: this.page.locator('input[type="number"]'),
    });
  }

  /**
   * Returns the budget-limit number input for a specific category.
   */
  budgetInputFor(category: string): Locator {
    return this.page
      .locator('div', { hasText: category })
      .filter({ has: this.page.locator('input[type="number"]') })
      .locator('input[type="number"]')
      .first();
  }

  /** Set the budget limit for a category and trigger onChange via Tab. */
  async setBudget(category: string, amount: number) {
    const input = this.budgetInputFor(category);
    await input.fill(String(amount));
    await input.press('Tab');
  }

  /**
   * Read the displayed KPI dollar value for a given label.
   * The StatCard renders: label <p> then value <p class="text-xl">.
   */
  async getKpiValue(label: 'Total Budget' | 'Total Spent' | 'Remaining'): Promise<string> {
    const card = this.page
      .locator('div', { has: this.page.getByText(label, { exact: true }) })
      .first();
    return (await card.locator('p.text-xl').textContent()) ?? '';
  }
}
