import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — encapsulates selectors and actions for the Expenses section.
 * Covers the transaction table, month selector, search/filter, sort, and the Add Expense form.
 */
export class ExpensesPage {
  // Month selector
  readonly monthJan: Locator;
  readonly monthFeb: Locator;
  readonly monthMar: Locator;

  // Table & search
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly transactionRows: Locator;
  readonly tableFooter: Locator;

  // Add Expense form toggle
  readonly addExpenseButton: Locator;

  // Add Expense form fields
  readonly formDate: Locator;
  readonly formDescription: Locator;
  readonly formAmount: Locator;
  readonly formCategory: Locator;
  readonly formSaveButton: Locator;

  constructor(private page: Page) {
    this.monthJan = page.getByRole('button', { name: 'Jan' });
    this.monthFeb = page.getByRole('button', { name: 'Feb' });
    this.monthMar = page.getByRole('button', { name: 'Mar' });

    this.searchInput    = page.getByPlaceholder(/search/i);
    this.categoryFilter = page.getByRole('combobox');
    this.transactionRows = page.locator('table tbody tr');
    this.tableFooter    = page.locator('table tfoot');

    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    this.formDate        = page.getByLabel(/date/i);
    this.formDescription = page.getByLabel(/description/i);
    this.formAmount      = page.getByLabel(/amount/i);
    this.formCategory    = page.getByLabel(/category/i);
    this.formSaveButton  = page.getByRole('button', { name: /save/i });
  }

  /** Navigate to the Expenses section via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  /** Open the Add Expense form. */
  async openAddExpenseForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fill and submit the Add Expense form.
   * `date` must be in YYYY-MM-DD format.
   */
  async addExpense(date: string, description: string, amount: number, category: string) {
    await this.openAddExpenseForm();
    await this.formDate.fill(date);
    await this.formDescription.fill(description);
    await this.formAmount.fill(String(amount));
    await this.formCategory.selectOption(category);
    await this.formSaveButton.click();
  }

  /** Type into the search box to filter transactions in real time. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the filter dropdown. */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  /** Click a column header to sort; clicking again toggles direction. */
  async sortBy(column: 'Date' | 'Category' | 'Amount') {
    await this.page.getByRole('columnheader', { name: column }).click();
  }
}
