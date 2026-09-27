import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 *
 * The Expenses tab contains:
 *  - An "Add Expense" button that toggles a form
 *  - A form with fields: date, description, amount, category, and a Save button
 *  - A search input ("Search transactions…")
 *  - A category-filter <select> ("All Categories")
 *  - A sortable table with columns: Date, Description, Category, Amount
 *  - A footer showing total count and total amount for the filtered list
 */
export class ExpensesPage {
  /** "Add Expense" button shown in the page header */
  readonly addExpenseButton: Locator;

  /** Form fields (visible only when the form is open) */
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly saveButton: Locator;

  /** Filters */
  readonly searchInput: Locator;
  readonly categorySelect: Locator;

  /** Table sort headers */
  readonly dateSortHeader: Locator;
  readonly categorySortHeader: Locator;
  readonly amountSortHeader: Locator;

  /** Empty-state row shown when no transactions match */
  readonly emptyState: Locator;

  constructor(private page: Page) {
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    // Form inputs (shown after clicking Add Expense)
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput      = page.getByPlaceholder('Amount');
    this.saveButton       = page.getByRole('button', { name: 'Save' });

    // Filters
    this.searchInput    = page.getByPlaceholder('Search transactions…');
    this.categorySelect = page.locator('select').filter({ hasText: 'All Categories' });

    // Sortable column headers (th elements)
    this.dateSortHeader     = page.getByRole('columnheader', { name: /date/i });
    this.categorySortHeader = page.getByRole('columnheader', { name: /category/i });
    this.amountSortHeader   = page.getByRole('columnheader', { name: /amount/i });

    // Empty state message
    this.emptyState = page.getByText('No transactions found');
  }

  /** Navigate to the Expenses tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  /** Open the Add Expense form. */
  async openAddForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fill and submit the Add Expense form.
   * Assumes the form is already open.
   */
  async addExpense(description: string, amount: string) {
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    await this.saveButton.click();
  }

  /** Type into the search input. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Filter by category name (e.g. "Food"). Pass "All" for the default. */
  async filterByCategory(category: string) {
    await this.categorySelect.selectOption(category);
  }

  /** Return all visible description-cell texts in the table. */
  async getTransactionDescriptions(): Promise<string[]> {
    return this.page
      .locator('tbody tr td:nth-child(2)')
      .allTextContents();
  }

  /** Return the footer summary text (e.g. "5 transactions"). */
  async getFooterCount(): Promise<string | null> {
    return this.page
      .locator('div.px-5.py-3 span')
      .first()
      .textContent();
  }
}
