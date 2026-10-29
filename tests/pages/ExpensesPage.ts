import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the Expenses tab.
 *
 * Covers: Add Expense form, transaction table, search/filter controls,
 * column sort toggles, and the month selector.
 */
export class ExpensesPage {
  // Navigation
  readonly sidebarButton: Locator;

  // Month selector
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // Add expense form trigger & form fields
  readonly addExpenseButton: Locator;
  readonly dateInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;

  // Search & filter
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;

  // Table
  readonly tableRows: Locator;
  readonly emptyState: Locator;
  readonly transactionCount: Locator;
  readonly totalLabel: Locator;

  // Sort headers
  readonly dateSortHeader: Locator;
  readonly categorySortHeader: Locator;
  readonly amountSortHeader: Locator;

  constructor(private page: Page) {
    this.sidebarButton = page.getByRole('button', { name: /expenses/i });

    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    // Form inputs — scoped to the "New Expense" card
    this.dateInput = page.locator('input[type="date"]');
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.categorySelect = page.locator('select').filter({ hasText: /Food|Housing|Transport/ }).first();
    this.saveButton = page.getByRole('button', { name: 'Save' });

    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').filter({ hasText: /All Categories/ });

    // Table rows (body rows only, not header)
    this.tableRows = page.locator('tbody tr');
    this.emptyState = page.getByText('No transactions found');

    // Footer row below table
    this.transactionCount = page.locator('div').filter({ hasText: /\d+ transaction/ }).last();
    this.totalLabel = page.locator('span').filter({ hasText: /Total:/ });

    this.dateSortHeader = page.getByRole('columnheader', { name: /date/i });
    this.categorySortHeader = page.getByRole('columnheader', { name: /category/i });
    this.amountSortHeader = page.getByRole('columnheader', { name: /amount/i });
  }

  /** Navigate to the Expenses tab via the sidebar. */
  async navigate() {
    await this.sidebarButton.click();
    await this.page.waitForSelector('h2:has-text("Expenses")');
  }

  /** Open (or toggle) the Add Expense form. */
  async openForm() {
    await this.addExpenseButton.click();
    await this.descriptionInput.waitFor({ state: 'visible' });
  }

  /** Fill and submit the Add Expense form. */
  async addExpense(opts: {
    date?: string;
    description: string;
    amount: string;
    category?: string;
  }) {
    if (opts.date) await this.dateInput.fill(opts.date);
    await this.descriptionInput.fill(opts.description);
    await this.amountInput.fill(opts.amount);
    if (opts.category) await this.categorySelect.selectOption(opts.category);
    await this.saveButton.click();
  }

  /** Filter the transaction list by category using the dropdown. */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  /** Type into the search box. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Click a sort column header. */
  async sortBy(field: 'date' | 'category' | 'amount') {
    const headerMap = {
      date: this.dateSortHeader,
      category: this.categorySortHeader,
      amount: this.amountSortHeader,
    };
    await headerMap[field].click();
  }
}
