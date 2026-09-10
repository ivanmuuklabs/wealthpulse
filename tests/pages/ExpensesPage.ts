import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 *
 * Features covered:
 *   - Month selector (shared with Dashboard)
 *   - "Add Expense" button / form (description, amount, category, Save)
 *   - Search input to filter transactions by text
 *   - Category dropdown filter
 *   - Sortable table (Date, Category, Amount columns)
 *   - Footer summary ("N transactions / Total: $X")
 */
export class ExpensesPage {
  readonly heading: Locator;
  readonly addExpenseButton: Locator;

  // Add-expense form fields
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;

  // Filters
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;

  // Table & footer
  readonly tableRows: Locator;        // <tr> rows inside <tbody>
  readonly noTransactionsRow: Locator; // empty-state row
  readonly footerSummary: Locator;

  constructor(private page: Page) {
    this.heading         = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    // Form (visible only when the form is open)
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput      = page.getByPlaceholder('Amount');
    this.categorySelect   = page.locator('select').first(); // the category <select> inside the form card
    this.saveButton       = page.getByRole('button', { name: 'Save' });

    // Filters row
    this.searchInput   = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.getByRole('combobox').first(); // "All Categories" dropdown

    // Transaction table
    this.tableRows           = page.locator('tbody tr').filter({ hasNotText: 'No transactions found' });
    this.noTransactionsRow   = page.getByText('No transactions found');
    this.footerSummary       = page.locator('div').filter({ hasText: /\d+ transactions?/ }).last();
  }

  /** Navigate to the Expenses tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  /**
   * Open the add-expense form, fill it in, and submit.
   * @param description  Transaction description
   * @param amount       Amount as a string (e.g. "42.50")
   * @param category     Category to select (must match a CATEGORIES value)
   */
  async addExpense(description: string, amount: string, category?: string) {
    await this.addExpenseButton.click();
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    if (category) {
      // The category <select> inside the form card (not the filter select)
      await this.page.locator('form, .\\!border-emerald-500\\/20').getByRole('combobox').selectOption(category)
        .catch(async () => {
          // Fallback: select by label text in any visible select
          await this.page.locator('select').filter({ hasText: category }).selectOption(category);
        });
    }
    await this.saveButton.click();
  }

  /** Type in the search box to filter the transaction list. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the category filter dropdown. */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  /** Click a sortable column header by its visible text. */
  async sortBy(column: 'Date' | 'Category' | 'Amount') {
    await this.page.getByRole('columnheader', { name: new RegExp(column, 'i') }).click();
  }
}
