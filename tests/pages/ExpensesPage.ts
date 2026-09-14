import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 *
 * Covers:
 *  - Add Expense button / form
 *  - Search transactions input
 *  - Category filter dropdown
 *  - Sortable table headers (Date, Category, Amount)
 *  - Transaction rows and the footer summary
 */
export class ExpensesPage {
  readonly heading: Locator;
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;
  readonly noResultsRow: Locator;
  // Table column headers used to trigger sorting
  readonly dateHeader: Locator;
  readonly categoryHeader: Locator;
  readonly amountHeader: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categorySelect = page.locator('select').filter({ hasText: 'All Categories' });
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.noResultsRow = page.getByText('No transactions found');
    this.dateHeader = page.getByText('Date', { exact: true });
    this.categoryHeader = page.getByText('Category', { exact: true });
    this.amountHeader = page.getByText('Amount', { exact: true });
  }

  /** Navigate to the Expenses tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Open the Add Expense form. */
  async openAddForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fill and submit the Add Expense form.
   * Assumes the form is already open.
   */
  async addExpense(description: string, amount: string, category: string = 'Food') {
    await this.page.getByPlaceholder('Description').fill(description);
    await this.page.getByPlaceholder('Amount').fill(amount);
    // Select category in the form's <select>
    const formCategorySelect = this.page
      .locator('select')
      .filter({ hasText: category })
      .first();
    await formCategorySelect.selectOption(category);
    await this.saveButton.click();
  }

  /** Type a query into the search box. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category filter. Pass 'All Categories' to reset. */
  async filterByCategory(category: string) {
    await this.categorySelect.selectOption(category);
  }

  /** Click the Amount column header to toggle sort. */
  async sortByAmount() {
    await this.amountHeader.click();
  }

  /** Click the Date column header to toggle sort. */
  async sortByDate() {
    await this.dateHeader.click();
  }

  /** Returns all visible amount cells (right-most column) as text strings. */
  async getAmountCellTexts(): Promise<string[]> {
    return this.page
      .locator('table tbody tr td:last-child')
      .allTextContents();
  }
}
