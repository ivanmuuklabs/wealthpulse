import { Page, Locator } from '@playwright/test';

/**
 * BudgetsPage
 * Page object for the Budgets tab (activeTab: budgets).
 *
 * Encapsulates all locators and interaction helpers for the Budgets module
 * so spec files stay focused on flows and assertions rather than raw selectors.
 */
export class BudgetsPage {
  /** Search input for filtering category cards by name */
  readonly searchInput: Locator;

  /** Month selector buttons */
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  constructor(private page: Page) {
    this.searchInput = page.getByPlaceholder('Search categories…');
    this.janButton   = page.getByRole('button', { name: 'Jan' });
    this.febButton   = page.getByRole('button', { name: 'Feb' });
    this.marButton   = page.getByRole('button', { name: 'Mar' });
  }

  /** Navigate to Budgets via the sidebar button and wait for the heading */
  async goto() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
    await expect_heading(this.page, 'Budgets');
  }

  /** Type a query into the category search input */
  async searchCategory(query: string) {
    await this.searchInput.fill(query);
  }

  /** Clear the search input */
  async clearSearch() {
    await this.searchInput.clear();
  }

  /**
   * Locate the card for a specific budget category.
   * Each card contains a <p> whose text exactly matches the category name.
   */
  categoryCard(name: string): Locator {
    return this.page.locator('[class*="rounded-2xl"]', {
      has: this.page.locator(`p.font-semibold:text-is("${name}")`),
    });
  }

  /**
   * The inline budget number input (spinbutton) inside a category card.
   * Changing its value immediately updates the progress bar, KPI cards, etc.
   */
  budgetInput(category: string): Locator {
    return this.categoryCard(category).getByRole('spinbutton');
  }

  /**
   * The remaining/over label for a given category card.
   * Shows "$N.NN left" when within budget, "$N.NN over" when over budget.
   */
  remainingLabel(category: string): Locator {
    return this.categoryCard(category).locator('span', { hasText: /left|over/ });
  }

  /**
   * The progress bar fill div inside a category card.
   * Its CSS classes indicate color (bg-emerald-500, bg-amber-500, bg-red-500, etc.).
   */
  progressBarFill(category: string): Locator {
    return this.categoryCard(category)
      .locator('[class*="h-2"][class*="rounded-full"] > div')
      .first();
  }

  /**
   * Set a category's inline budget to `amount` by clicking into the input and retyping.
   * Changes apply immediately (no submit required).
   */
  async setBudget(category: string, amount: number) {
    const input = this.budgetInput(category);
    await input.click({ clickCount: 3 });
    await input.fill(String(amount));
    // Trigger the onChange event so React processes the new value
    await input.press('Tab');
  }

  /**
   * Read the dollar value displayed in a summary KPI card (Total Budget,
   * Total Spent, or Remaining) as a number. Looks for the first "$N,NNN"
   * text node within the card.
   */
  async getKpiAmount(labelText: string): Promise<number> {
    const card = this.page.locator('[class*="rounded-2xl"]', { hasText: labelText }).first();
    const valueText = await card
      .locator('p.text-xl')
      .first()
      .textContent();
    return parseFloat((valueText ?? '0').replace(/[$,]/g, ''));
  }
}

/** Tiny helper to wait for an h2 heading to appear after navigation */
async function expect_heading(page: Page, text: string) {
  await page.waitForSelector(`h2:text-is("${text}")`);
}
