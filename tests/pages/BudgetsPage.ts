import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Budgets tab.
 *
 * Covers:
 *  - Navigating to the tab
 *  - Month switching (Jan / Feb / Mar)
 *  - KPI stat cards (Total Budget, Total Spent, Remaining)
 *  - Category search input
 *  - Budget category cards (progress bar, inline edit spinbutton)
 */
export class BudgetsPage {
  readonly navButton: Locator;

  // Month selector buttons
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // Heading
  readonly budgetsHeading: Locator;

  // KPI labels
  readonly totalBudgetCard: Locator;
  readonly totalSpentCard: Locator;
  readonly remainingCard: Locator;

  // Category search
  readonly searchInput: Locator;

  // Category cards grid: each card contains the category name
  readonly categoryCards: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /budgets/i });

    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    this.budgetsHeading = page.getByRole('heading', { name: 'Budgets' });

    this.totalBudgetCard = page.locator('p', { hasText: 'Total Budget' }).first();
    this.totalSpentCard = page.locator('p', { hasText: 'Total Spent' }).first();
    this.remainingCard = page.locator('p', { hasText: 'Remaining' }).first();

    this.searchInput = page.getByPlaceholder('Search categories…');

    // Category cards each have a Budget spinbutton input; filter by cards that have one
    this.categoryCards = page.locator('div').filter({ has: page.getByRole('spinbutton') });
  }

  async navigate() {
    await this.navButton.click();
  }

  /** Search for a category by name */
  async searchCategory(term: string) {
    await this.searchInput.fill(term);
  }

  /** Get the spinbutton (inline budget input) for a named category */
  getCategoryBudgetInput(categoryName: string): Locator {
    return this.page
      .locator('div', { hasText: new RegExp(`^${categoryName}`) })
      .getByRole('spinbutton')
      .first();
  }

  /** Set the budget value for a named category */
  async setBudget(categoryName: string, amount: number) {
    const input = this.getCategoryBudgetInput(categoryName);
    await input.fill(String(amount));
    await input.press('Tab'); // trigger onChange
  }

  /** Read the KPI dollar value for Total Budget, Total Spent, or Remaining */
  async getKpiValue(label: 'Total Budget' | 'Total Spent' | 'Remaining'): Promise<number> {
    const card = this.page
      .locator('div')
      .filter({ has: this.page.locator('p', { hasText: label }) })
      .first();
    const text = await card.locator('p.text-xl').first().textContent();
    return parseFloat((text ?? '0').replace(/[$,]/g, ''));
  }
}
