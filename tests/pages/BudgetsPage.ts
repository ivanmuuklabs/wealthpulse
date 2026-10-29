import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Budgets tab.
 *
 * Covers: the three KPI cards (Total Budget, Total Spent, Remaining),
 * the per-category budget cards, the inline budget-limit spinbutton,
 * category search, and the month selector.
 */
export class BudgetsPage {
  readonly heading: Locator;
  readonly totalBudgetCard: Locator;
  readonly totalSpentCard: Locator;
  readonly remainingCard: Locator;
  readonly categoryCards: Locator;
  readonly searchInput: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Budgets' });

    // KPI StatCards — identified by their label text
    this.totalBudgetCard = page.getByText('Total Budget').locator('..');
    this.totalSpentCard  = page.getByText('Total Spent').first().locator('..');
    this.remainingCard   = page.getByText('Remaining').first().locator('..');

    // Each category budget card contains an icon + progress bar + edit input
    this.categoryCards = page.locator('div').filter({
      has: page.locator('input[type="number"]'),
    }).filter({ has: page.locator('div.w-full.h-2') });

    // Category search box
    this.searchInput = page.getByPlaceholder('Search categories…');
  }

  /** Navigate to the Budgets section from the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  /**
   * Return the budget-limit number input for a given category name.
   * Usage: await page.budgets().budgetInput('Housing').fill('2500')
   */
  budgetInput(category: string): Locator {
    return this.page
      .locator('div', { has: this.page.getByText(category, { exact: true }) })
      .locator('input[type="number"]')
      .first();
  }

  /** Return the "X left" / "X over" remaining label for a category. */
  remainingLabel(category: string): Locator {
    return this.page
      .locator('div', { has: this.page.getByText(category, { exact: true }) })
      .locator('span.text-xs.ml-auto');
  }

  /** Filter the category list using the search box. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }
}
