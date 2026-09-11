import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Expenses tab.
 * Covers the transaction list, search/filter, sort controls,
 * and the Add Expense form.
 */
export class ExpensesPage {
  readonly heading: Locator;
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly saveButton: Locator;
  readonly transactionRows: Locator;
  readonly emptyState: Locator;
  readonly totalFooter: Locator;

  constructor(private page: Page) {
    this.heading         = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput     = page.getByPlaceholder('Search transactions…');
    this.categoryFilter  = page.locator('select').filter({ hasText: 'All Categories' });
    // Save button inside the Add Expense form card
    this.saveButton      = page.getByRole('button', { name: 'Save' });
    // Table body rows (each transaction is a <tr>)
    this.transactionRows = page.locator('tbody tr');
    this.emptyState      = page.getByText('No transactions found');
    this.totalFooter     = page.locator('text=/Total:/');
  }

  /** Navigate to the Expenses tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  /** Open/close the Add Expense inline form. */
  async openAddForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fill and submit the Add Expense form.
   * @param date   ISO date string (YYYY-MM-DD)
   * @param desc   Transaction description
   * @param amount Numeric amount (will be typed as a string)
   * @param category Category option text (default: 'Food')
   */
  async addExpense(date: string, desc: string, amount: number, category = 'Food') {
    // Date input
    await this.page.locator('input[type="date"]').fill(date);
    // Description input — placeholder is "Description"
    await this.page.getByPlaceholder('Description').fill(desc);
    // Amount input — placeholder is "Amount"
    await this.page.getByPlaceholder('Amount').fill(String(amount));
    // Category select inside the form (second select on the page, first is category filter)
    await this.page.locator('form, .\\!border-emerald-500\\/20').locator('select').selectOption(category);
    await this.saveButton.click();
  }

  /** Type a search term into the transaction search box. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category in the category filter dropdown. */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  /** Click a sortable column header. Accepts 'Date', 'Category', or 'Amount'. */
  async sortBy(column: 'Date' | 'Category' | 'Amount') {
    await this.page
      .locator('th', { hasText: column })
      .click();
  }
}
