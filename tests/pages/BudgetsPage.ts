import { Page, Locator } from '@playwright/test';

export class BudgetsPage {
  readonly searchInput: Locator;
  readonly kpiTotalBudget: Locator;
  readonly kpiTotalSpent: Locator;
  readonly kpiRemaining: Locator;
  readonly monthSelector: { jan: Locator; feb: Locator; mar: Locator };

  constructor(private page: Page) {
    this.searchInput    = page.getByPlaceholder('Search categories…');
    this.kpiTotalBudget = page.getByText('Total Budget');
    this.kpiTotalSpent  = page.getByText('Total Spent');
    this.kpiRemaining   = page.getByText('Remaining');
    this.monthSelector  = {
      jan: page.getByRole('button', { name: 'Jan' }),
      feb: page.getByRole('button', { name: 'Feb' }),
      mar: page.getByRole('button', { name: 'Mar' }),
    };
  }

  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.monthSelector[month.toLowerCase() as 'jan' | 'feb' | 'mar'].click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Returns the category card locator for a given category name */
  categoryCard(name: string): Locator {
    return this.page.locator('[class*="rounded"]').filter({ hasText: name });
  }

  /** Returns the budget amount input for a given category */
  budgetInput(categoryName: string): Locator {
    return this.categoryCard(categoryName).getByRole('spinbutton');
  }

  /** Returns the progress bar element within a category card */
  progressBar(categoryName: string): Locator {
    return this.categoryCard(categoryName).locator('[class*="h-2"]');
  }
}
