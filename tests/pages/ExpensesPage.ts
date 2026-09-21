import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Expenses section.
 *
 * Covers: month selector, search/filter, add expense form, and the
 * sortable transactions table.
 */
export class ExpensesPage {
  /** Search input — filters by description, category, or date */
  readonly searchInput: Locator;

  /** Category filter dropdown */
  readonly categoryFilter: Locator;

  /** "Add Expense" button that toggles the new-expense form */
  readonly addExpenseButton: Locator;

  /** Transaction table body rows */
  readonly tableRows: Locator;

  /** Footer row showing filtered count and total */
  readonly tableFooter: Locator;

  // ── New Expense form fields ──────────────────────────────────────────
  readonly dateInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;

  constructor(private page: Page) {
    this.searchInput     = page.getByPlaceholder(/search/i);
    this.categoryFilter  = page.getByRole('combobox').first();
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    // Table rows: each row in the expenses table contains a date cell
    this.tableRows   = page.locator('tbody tr');
    this.tableFooter = page.locator('tfoot tr').first();

    // New Expense form
    this.dateInput        = page.getByLabel(/date/i);
    this.descriptionInput = page.getByPlaceholder(/description/i);
    this.amountInput      = page.getByLabel(/amount/i);
    this.categorySelect   = page.getByRole('combobox').nth(1);
    this.saveButton       = page.getByRole('button', { name: /^save$/i });
  }

  /** Navigate to the Expenses section from anywhere in the authenticated app. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  /** Click a month button by label. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /** Type into the search box. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Open the Add Expense form. */
  async openAddExpenseForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fill and submit the Add Expense form.
   * Date defaults to the pre-filled value; pass a YYYY-MM-DD string to override.
   */
  async addExpense(opts: {
    description: string;
    amount: string;
    category?: string;
    date?: string;
  }) {
    if (opts.date) {
      await this.dateInput.fill(opts.date);
    }
    await this.descriptionInput.fill(opts.description);
    await this.amountInput.fill(opts.amount);
    if (opts.category) {
      await this.categorySelect.selectOption(opts.category);
    }
    await this.saveButton.click();
  }

  /** Click a column header to sort the table. */
  async sortBy(column: 'Date' | 'Category' | 'Amount') {
    await this.page.getByRole('columnheader', { name: column }).click();
  }
}
