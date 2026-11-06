import { Page, Locator } from '@playwright/test';
import { parseMoney } from '../helpers/money';

export type NewExpense = {
  description: string;
  amount: number | string;
  category?: string;
};

export class ExpensesPage {
  readonly addExpenseButton: Locator;
  readonly formHeading: Locator;
  readonly dateInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly formCategorySelect: Locator;
  readonly saveButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly rows: Locator;
  readonly emptyState: Locator;
  readonly countLabel: Locator;
  readonly totalLabel: Locator;
  readonly dateCells: Locator;
  readonly categoryCells: Locator;
  readonly amountCells: Locator;

  constructor(private page: Page) {
    this.addExpenseButton = page.getByRole('button', { name: 'Add Expense' });
    this.formHeading = page.getByRole('heading', { name: 'New Expense' });
    this.dateInput = page.locator('input[type="date"]');
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.saveButton = page.getByRole('button', { name: 'Save' });

    // Two <select>s exist on this tab: the form's category (no "All" option)
    // and the list filter (has an "All" option).
    this.formCategorySelect = page
      .locator('select')
      .filter({ hasNot: page.locator('option[value="All"]') });
    this.categoryFilter = page
      .locator('select')
      .filter({ has: page.locator('option[value="All"]') });

    this.searchInput = page.getByPlaceholder('Search transactions…');

    // Only real transaction rows (4 cells); the empty-state row has a single colSpan cell.
    this.rows = page.locator('tbody tr:has(td:nth-child(4))');
    this.emptyState = page.getByText('No transactions found');
    this.countLabel = page.getByText(/^\d+ transactions?$/);
    this.totalLabel = page.getByText(/^Total:/);

    this.dateCells = this.rows.locator('td:nth-child(1)');
    this.categoryCells = this.rows.locator('td:nth-child(3)');
    this.amountCells = this.rows.locator('td:nth-child(4)');
  }

  /** Opens the Expenses tab from the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: 'Expenses', exact: true }).click();
    await this.page.getByRole('heading', { name: 'Expenses', exact: true }).waitFor();
  }

  async openForm() {
    await this.addExpenseButton.click();
  }

  /** Opens the form, fills it and clicks Save. Date keeps its default (the 15th of the selected month). */
  async addExpense({ description, amount, category }: NewExpense) {
    await this.openForm();
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(String(amount));
    if (category) await this.formCategorySelect.selectOption(category);
    await this.saveButton.click();
  }

  rowByDescription(description: string): Locator {
    return this.rows.filter({ hasText: description });
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  sortBy(column: 'Date' | 'Category' | 'Amount') {
    return this.page.getByRole('columnheader', { name: column }).click();
  }

  /** Number shown in the "N transactions" footer. */
  async getCount(): Promise<number> {
    return parseInt(await this.countLabel.innerText(), 10);
  }

  /** Amount shown in the "Total: $X" footer. */
  async getTotal(): Promise<number> {
    return parseMoney(await this.totalLabel.innerText());
  }

  async getDates(): Promise<string[]> {
    return (await this.dateCells.allTextContents()).map(t => t.trim());
  }

  /** Category names without the leading emoji icon. */
  async getCategories(): Promise<string[]> {
    return (await this.categoryCells.allTextContents()).map(t => t.replace(/^[^A-Za-z]+/, '').trim());
  }

  /** Absolute row amounts (rows display them as "-$12.34"). */
  async getAmounts(): Promise<number[]> {
    return (await this.amountCells.allTextContents()).map(t => Math.abs(parseMoney(t)));
  }
}
