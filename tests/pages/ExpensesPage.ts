import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the Expenses tab of WealthPulse.
 *
 * Covers:
 *  - Navigating to the Expenses section via the sidebar
 *  - Adding a new expense via the form
 *  - Filtering by category and searching by keyword
 *  - Sorting the transaction table
 */
export class ExpensesPage {
  /** Sidebar nav button that opens the Expenses section */
  readonly navButton: Locator;

  /** "Add Expense" button that toggles the new-expense form */
  readonly addExpenseButton: Locator;

  /** Form fields (visible only when the form is open) */
  readonly formDate: Locator;
  readonly formDescription: Locator;
  readonly formAmount: Locator;
  readonly formCategory: Locator;
  readonly formSaveButton: Locator;

  /** Search input above the table */
  readonly searchInput: Locator;

  /** Category filter dropdown */
  readonly categoryFilter: Locator;

  /** Table rows in the transaction list (tbody rows only) */
  readonly tableRows: Locator;

  /** Empty-state cell shown when no transactions match */
  readonly emptyState: Locator;

  /** Footer summary text ("N transactions") */
  readonly transactionCount: Locator;

  /** Column headers (clickable for sort) */
  readonly dateHeader: Locator;
  readonly amountHeader: Locator;
  readonly categoryHeader: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /expenses/i });

    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    // New-expense form inputs
    this.formDate = page.locator('input[type="date"]').first();
    this.formDescription = page.getByPlaceholder('Description');
    this.formAmount = page.getByPlaceholder('Amount');
    this.formCategory = page.locator('select').nth(1); // second select (first is category filter)
    this.formSaveButton = page.getByRole('button', { name: /^save$/i });

    // Filters
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').first();

    // Table
    this.tableRows = page.locator('table tbody tr:not([colspan])');
    this.emptyState = page.getByText('No transactions found');
    this.transactionCount = page.locator('footer', { hasText: /transaction/ }).first();

    // Sortable headers
    this.dateHeader = page.getByRole('columnheader', { name: /date/i });
    this.amountHeader = page.getByRole('columnheader', { name: /amount/i });
    this.categoryHeader = page.getByRole('columnheader', { name: /category/i });
  }

  /** Navigate to the Expenses section */
  async navigate() {
    await this.navButton.click();
    await this.page.getByRole('heading', { name: 'Expenses' }).waitFor({ state: 'visible' });
  }

  /** Open the add-expense form if it is not already visible */
  async openAddForm() {
    if (!(await this.formDescription.isVisible())) {
      await this.addExpenseButton.click();
    }
  }

  /**
   * Fill and submit the new-expense form.
   * @param description  Transaction description text
   * @param amount       Dollar amount (e.g. 42.50)
   * @param category     Category name matching a dropdown option (defaults to "Food")
   * @param date         ISO date string YYYY-MM-DD (defaults to "2026-03-15")
   */
  async addExpense(
    description: string,
    amount: number,
    category = 'Food',
    date = '2026-03-15',
  ) {
    await this.openAddForm();
    await this.formDate.fill(date);
    await this.formDescription.fill(description);
    await this.formAmount.fill(String(amount));
    await this.formCategory.selectOption(category);
    await this.formSaveButton.click();
  }

  /** Filter the transaction list by entering a search term */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category in the filter dropdown ("All" to clear) */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }
}
