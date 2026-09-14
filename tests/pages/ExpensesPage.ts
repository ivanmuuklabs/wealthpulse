import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Expenses tab.
 *
 * Encapsulates all locators and interactions for the Expenses section,
 * including the transaction table, add-expense form, search, and sort controls.
 */
export class ExpensesPage {
  // Navigation / header
  readonly heading: Locator;

  // Add Expense button and form
  readonly addExpenseButton: Locator;
  readonly dateInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;

  // Filters
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;

  // Table
  readonly tableRows: Locator;
  readonly noResultsRow: Locator;
  readonly tableTotal: Locator;

  // Sort headers
  readonly dateSortHeader: Locator;
  readonly categorySortHeader: Locator;
  readonly amountSortHeader: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Expenses' });

    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.dateInput = page.locator('input[type="date"]');
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.categorySelect = page.locator('select').first();
    this.saveButton = page.getByRole('button', { name: 'Save' });

    this.searchInput = page.getByPlaceholder('Search transactions…');
    // Category filter dropdown (the one inside the filters bar)
    this.categoryFilter = page.locator('select').nth(1);

    // Table body rows (exclude the header row and the empty-state row)
    this.tableRows = page.locator('tbody tr').filter({ hasNot: page.locator('td[colspan]') });
    this.noResultsRow = page.getByText('No transactions found');
    this.tableTotal = page.locator('text=/Total:/');

    this.dateSortHeader = page.getByText('Date', { exact: false }).first();
    this.categorySortHeader = page.getByText('Category', { exact: false }).first();
    this.amountSortHeader = page.getByText('Amount', { exact: false }).first();
  }

  /** Navigate to the Expenses tab from the sidebar */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  /** Open the add-expense form */
  async openAddExpenseForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fill and submit the add-expense form.
   * `date` should be in YYYY-MM-DD format.
   */
  async addExpense(description: string, amount: number, category: string, date?: string) {
    await this.openAddExpenseForm();
    if (date) {
      await this.dateInput.fill(date);
    }
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(String(amount));
    await this.categorySelect.selectOption(category);
    await this.saveButton.click();
  }

  /** Type into the search box */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the filter dropdown */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  /** Click the Date column header to toggle sort */
  async sortByDate() {
    await this.dateSortHeader.click();
  }

  /** Click the Amount column header to toggle sort */
  async sortByAmount() {
    await this.amountSortHeader.click();
  }
}
