import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage — encapsulates selectors and actions for the Budgets tab.
 *
 * The Budgets tab provides:
 *  - Three KPI cards: Total Budget, Total Spent, Remaining
 *  - A category search input to filter budget cards
 *  - A month selector (Jan / Feb / Mar) — shared with other tabs
 *  - One card per category (8 by default) with:
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

  // ── Search ───────────────────────────────────────────────
  readonly searchInput: Locator;

  // ── Budget category cards ─────────────────────────────────
  /** All visible budget category cards (one per category). */
  readonly categoryCards: Locator;

  // ── Page heading ─────────────────────────────────────────
  readonly budgetsHeading: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /budgets/i });

    // Month selector
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    // KPI card labels
    this.totalBudgetLabel = page.getByText('Total Budget', { exact: true });
    this.totalSpentLabel  = page.getByText('Total Spent',  { exact: true });
    this.remainingLabel   = page.getByText('Remaining',    { exact: true });

    // Category search (placeholder matches the app source exactly)
    this.searchInput = page.getByPlaceholder('Search categories…');

    // Category cards — each card contains a number input for the budget limit
    this.categoryCards = page.locator('input[type="number"]').locator('..').locator('..');

    this.budgetsHeading = page.getByRole('heading', { name: /budgets/i });
  }

  /** Navigate to the Budgets tab via the sidebar. */
  async navigate() {
    await this.navButton.click();
  }

  /** Click a month button. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    const btn = month === 'Jan' ? this.janButton : month === 'Feb' ? this.febButton : this.marButton;
    await btn.click();
  }

  /** Type into the category search input. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Return all visible category card elements.
   * Each card renders one category name text.
   */
  categoryCardsByName(): Locator {
    // Cards always contain the category name as visible text alongside a number input
    return this.page.locator('.grid > div').filter({ has: this.page.locator('input[type="number"]') });
  }

  /**
   * Get the budget-limit numeric input for a specific category.
   * @param category — one of the 8 CATEGORIES from the app (e.g. "Housing")
   */
  budgetInputFor(category: string): Locator {
    return this.page
      .locator('div', { hasText: category })
      .filter({ has: this.page.locator('input[type="number"]') })
      .locator('input[type="number"]')
      .first();
  }

  /**
   * Set the budget limit for a given category.
   */
  async setBudget(category: string, amount: number) {
    const input = this.budgetInputFor(category);
    await input.fill(String(amount));
    await input.press('Tab'); // trigger onChange
  }

  /**
   * Read the displayed KPI value for a label.
   * Finds the stat card that contains the label and returns the dollar value text.
   */
  async getKpiValue(label: 'Total Budget' | 'Total Spent' | 'Remaining'): Promise<string> {
    const card = this.page.locator('div', { has: this.page.getByText(label, { exact: true }) }).first();
    return (await card.locator('p.text-xl').textContent()) ?? '';
  }
}
