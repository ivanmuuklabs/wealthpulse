import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage encapsulates selectors and interactions for the Expenses module.
 * Covers: month selection, add-expense form, search/filter, and table sorting.
 */
export class ExpensesPage {
  readonly searchInput: Locator;
  readonly categoryDropdown: Locator;
  readonly addExpenseButton: Locator;
  readonly saveButton: Locator;
  readonly tableRows: Locator;
  readonly footerSummary: Locator;

  // Add-expense form fields
  readonly dateInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;

  constructor(private page: Page) {
    this.searchInput      = page.getByPlaceholder(/search/i);
    this.categoryDropdown = page.getByRole('combobox');
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.saveButton       = page.getByRole('button', { name: /save/i });
    this.tableRows        = page.locator('tbody tr');
    this.footerSummary    = page.locator('tfoot');

    // Add-expense form — these are only present when the form is expanded
    this.dateInput        = page.locator('input[type="date"]');
    this.descriptionInput = page.getByPlaceholder(/description/i);
    this.amountInput      = page.locator('input[type="number"]');
    this.categorySelect   = page.locator('select');
  }

  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /** Open the Add Expense form. */
  async openAddExpenseForm() {
    await this.addExpenseButton.click();
  }

  /** Fill and submit the add-expense form. */
  async addExpense(description: string, amount: number, category?: string) {
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(String(amount));
    if (category) {
      await this.categorySelect.selectOption(category);
    }
    await this.saveButton.click();
  }

  /** Type into the search box to filter the transaction table in real time. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the filter dropdown. */
  async filterByCategory(category: string) {
    await this.categoryDropdown.selectOption(category);
  }

  /** Click a sortable column header by its visible label. */
  async sortBy(column: 'Date' | 'Category' | 'Amount') {
    await this.page.getByRole('columnheader', { name: column }).click();
  }
}
