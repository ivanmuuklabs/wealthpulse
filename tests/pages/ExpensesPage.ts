import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Expenses tab.
 * Covers the add-expense form, search/filter bar, sort headers,
 * and the transaction table.
 */
export class ExpensesPage {
  /** "Add Expense" toggle button in the header area */
  readonly addExpenseButton: Locator;
  /** Transaction search input */
  readonly searchInput: Locator;
  /** Category filter <select> */
  readonly categoryFilter: Locator;
  /** "Description" text input inside the add-expense form */
  readonly descriptionInput: Locator;
  /** "Amount" numeric input inside the add-expense form */
  readonly amountInput: Locator;
  /** "Save" button inside the add-expense form */
  readonly saveButton: Locator;
  /** Transaction table body rows */
  readonly tableRows: Locator;
  /** Table footer showing row count and total */
  readonly tableFooter: Locator;
  /** "No transactions found" empty-state cell */
  readonly emptyState: Locator;
  /** "Date" column header (clickable to sort) */
  readonly dateSortHeader: Locator;
  /** "Amount" column header (clickable to sort) */
  readonly amountSortHeader: Locator;

  constructor(private page: Page) {
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').filter({ hasText: /All Categories/ });
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.tableRows = page.locator('tbody tr').filter({ hasNotText: 'No transactions found' });
    this.tableFooter = page.locator('div.px-5.py-3.border-t');
    this.emptyState = page.getByText('No transactions found');
    this.dateSortHeader = page.getByRole('columnheader', { name: /date/i });
    this.amountSortHeader = page.getByRole('columnheader', { name: /amount/i });
  }

  /** Navigate to the Expenses tab via the sidebar */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  /** Open the add-expense form */
  async openAddForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fill and submit the add-expense form.
   * Category defaults to "Food" (matching the form's initial state).
   */
  async addExpense(description: string, amount: string, category: string = 'Food') {
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    // Change category if different from default
    await this.page.locator('select').last().selectOption(category);
    await this.saveButton.click();
  }

  /** Type into the search/filter box */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the filter dropdown */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  /** Click the Amount column header to sort */
  async sortByAmount() {
    await this.amountSortHeader.click();
  }
}
