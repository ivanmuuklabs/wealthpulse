import { Page, Locator } from '@playwright/test';

export class ExpensesPage {
  readonly searchInput: Locator;
  readonly categoryFilterSelect: Locator;
  readonly addExpenseButton: Locator;
  readonly saveExpenseButton: Locator;
  readonly dateInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly tableRows: Locator;
  readonly tableFooter: Locator;

  constructor(private page: Page) {
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilterSelect = page.getByRole('combobox', { name: /category/i });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.saveExpenseButton = page.getByRole('button', { name: /save/i });

    // New Expense form fields
    this.dateInput = page.getByLabel('Date');
    this.descriptionInput = page.getByLabel('Description');
    this.amountInput = page.getByLabel('Amount');
    this.categorySelect = page.getByLabel('Category');

    // Transactions table body rows (each data row has a date cell)
    this.tableRows = page.locator('table tbody tr');

    // Footer row that shows filtered count and total
    this.tableFooter = page.locator('table tfoot tr');
  }

  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  /** Click a month selector button by abbreviated name */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /** Open the Add Expense form */
  async openAddExpenseForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fill and submit the Add Expense form.
   * @param date  ISO date string, e.g. '2026-01-15'
   * @param description  Free-text description
   * @param amount  Numeric amount (e.g. 42.50)
   * @param category  One of the category option values
   */
  async addExpense(
    date: string,
    description: string,
    amount: number,
    category: string
  ) {
    await this.openAddExpenseForm();
    await this.dateInput.fill(date);
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(String(amount));
    await this.categorySelect.selectOption(category);
    await this.saveExpenseButton.click();
  }

  /** Type into the search input to filter transactions */
  async search(query: string) {
    await this.searchInput.fill(query);
  }

  /** Select a category filter from the dropdown */
  async filterByCategory(category: string) {
    await this.categoryFilterSelect.selectOption(category);
  }
}
