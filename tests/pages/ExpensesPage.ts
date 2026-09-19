import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 *
 * Covers the transaction list, add-expense form, search/filter controls,
 * and the column-sort behaviour surfaced in the Expenses tab.
 */
export class ExpensesPage {
  // Navigation
  readonly navButton: Locator;

  // Header controls
  readonly addExpenseButton: Locator;

  // Add-expense form fields
  readonly formDateInput: Locator;
  readonly formDescriptionInput: Locator;
  readonly formAmountInput: Locator;
  readonly formCategorySelect: Locator;
  readonly formSaveButton: Locator;

  // Filters
  readonly searchInput: Locator;
  readonly categoryFilterSelect: Locator;

  // Table
  readonly tableRows: Locator;
  readonly noTransactionsMessage: Locator;
  readonly footerCount: Locator;
  readonly footerTotal: Locator;

  // Column sort headers
  readonly sortByDateHeader: Locator;
  readonly sortByAmountHeader: Locator;
  readonly sortByCategoryHeader: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /expenses/i });

    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    // Form fields inside the "New Expense" card
    this.formDateInput = page.locator('input[type="date"]');
    this.formDescriptionInput = page.getByPlaceholder('Description');
    this.formAmountInput = page.getByPlaceholder('Amount');
    this.formCategorySelect = page.locator('select').first();
    this.formSaveButton = page.getByRole('button', { name: 'Save' });

    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilterSelect = page.locator('select').last();

    // Transaction rows inside the table body
    this.tableRows = page.locator('table tbody tr').filter({ hasNot: page.locator('td[colspan]') });
    this.noTransactionsMessage = page.getByText('No transactions found');
    this.footerCount = page.locator('table + div span').first();
    this.footerTotal = page.locator('table + div span').last();

    this.sortByDateHeader = page.getByRole('columnheader', { name: /date/i });
    this.sortByAmountHeader = page.getByRole('columnheader', { name: /amount/i });
    this.sortByCategoryHeader = page.getByRole('columnheader', { name: /category/i });
  }

  /** Navigate to the Expenses tab from any authenticated view. */
  async navigate() {
    await this.navButton.click();
    await this.page.getByRole('heading', { name: 'Expenses' }).waitFor();
  }

  /** Open the add-expense form, fill it in and save. */
  async addExpense(opts: {
    date?: string;
    description: string;
    amount: string;
    category?: string;
  }) {
    await this.addExpenseButton.click();
    if (opts.date) await this.formDateInput.fill(opts.date);
    await this.formDescriptionInput.fill(opts.description);
    await this.formAmountInput.fill(opts.amount);
    if (opts.category) await this.formCategorySelect.selectOption(opts.category);
    await this.formSaveButton.click();
  }

  /** Type into the search box. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the filter dropdown. */
  async filterByCategory(category: string) {
    await this.categoryFilterSelect.selectOption(category);
  }
}
