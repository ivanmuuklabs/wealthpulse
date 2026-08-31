import { Page, Locator } from '@playwright/test';

export class BudgetsPage {
  readonly categoryCards: Locator;
  readonly totalBudgetValue: Locator;

  constructor(private page: Page) {
    // Each budget category card contains a progress bar and spend/budget labels
    this.categoryCards = page.locator('div').filter({ hasText: /\$\d+.*\/.*\$\d+/ });
    // The Total Budget KPI card at the top
    this.totalBudgetValue = page
      .locator('div')
      .filter({ hasText: /total budget/i })
      .first();
  }

  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  /**
   * Finds the budget input for a given category label (e.g. "Food & Dining")
   * and sets it to a new amount string (e.g. "800").
   */
  async setCategoryBudget(categoryLabel: string, amount: string) {
    // Each category card contains an editable input next to the category name
    const card = this.page
      .locator('div')
      .filter({ hasText: new RegExp(categoryLabel, 'i') })
      .first();
    const input = card.locator('input[type="number"], input[type="text"]').first();
    await input.clear();
    await input.fill(amount);
    // Blur to trigger the update
    await input.press('Tab');
  }

  /**
   * Returns the text of the progress label for a given category card
   * (e.g. "60%" or "$600 / $800").
   */
  async getCategoryProgressText(categoryLabel: string): Promise<string> {
    const card = this.page
      .locator('div')
      .filter({ hasText: new RegExp(categoryLabel, 'i') })
      .first();
    return (await card.textContent()) ?? '';
  }
}
