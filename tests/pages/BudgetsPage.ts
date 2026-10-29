import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Budgets tab.
 *
 * Covers: the three overview KPI cards, the per-category budget cards
 * (each has a progress bar, a spinbutton for editing, and a remaining label),
 * the category search input, and the month selector.
 */
export class BudgetsPage {
  readonly heading: Locator;

  // Month selector buttons (shared across tabs via MonthButton)
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // Overview KPI labels
  readonly totalBudgetLabel: Locator;
  readonly totalSpentLabel: Locator;
  readonly remainingLabel: Locator;

  // Category search
  readonly searchInput: Locator;

  // Category budget cards — each contains a spinbutton for editing the budget amount
  readonly categoryCards: Locator;
  readonly budgetSpinbuttons: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Budgets' });

    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    // KPI card labels (uppercase small paragraphs inside StatCard)
    this.totalBudgetLabel = page.getByText('Total Budget').first();
    this.totalSpentLabel = page.getByText('Total Spent').first();
    this.remainingLabel = page.getByText('Remaining').first();

    // Category search (shared SearchInput component)
    this.searchInput = page.getByPlaceholder('Search categories…');

    // Budget cards — one per category; each wraps a number input (spinbutton)
    this.categoryCards = page.locator('.grid > div').filter({ has: page.locator('input[type="number"]') });
    this.budgetSpinbuttons = page.locator('input[type="number"]');
  }

  async navigate() {
    await this.page.getByRole('button', { name: /budgets/i }).click();
  }

  /** Select a month by index (0=Jan, 1=Feb, 2=Mar) */
  async selectMonth(m: 0 | 1 | 2) {
    const buttons = [this.janButton, this.febButton, this.marButton];
    await buttons[m].click();
  }

  /** Filter budget category cards by search term */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Clear the category search input */
  async clearSearch() {
    await this.searchInput.clear();
  }

  /**
   * Set the budget amount for the nth category card (0-indexed).
   * Uses the number spinbutton inside each card.
   */
  async setBudget(cardIndex: number, amount: number) {
    const input = this.budgetSpinbuttons.nth(cardIndex);
    await input.fill(String(amount));
    await input.press('Tab'); // trigger onChange
  }

  /**
   * Read the KPI value text for a given label.
   * Returns the raw text content of the bold value element.
   */
  async getKpiValue(label: 'Total Budget' | 'Total Spent' | 'Remaining') {
    const labelEl = this.page.locator('p').filter({ hasText: new RegExp(`^${label}$`, 'i') }).first();
    return labelEl.locator('~ p').first().textContent();
  }
}
