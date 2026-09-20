import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Expenses tab.
 * Covers navigation, the "Add Expense" form, the search input,
 * the category filter select, the sortable table, and the summary footer.
 */
export class ExpensesPage {
  /** "Add Expense" button that toggles the form */
  readonly addExpenseButton: Locator;

  /** Form fields (only visible when showForm is true) */
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;

  /** Search input in the filter bar */
  readonly searchInput: Locator;

  /** Category filter <select> */
  readonly categoryFilterSelect: Locator;

  /** Transaction table rows (tbody rows) */
  readonly transactionRows: Locator;

  /** "No transactions found" empty-state cell */
  readonly emptyState: Locator;

  /** Footer summary showing transaction count and total */
  readonly footerSummary: Locator;

  /** Column sort header for Amount */
  readonly amountSortHeader: Locator;

  /** Column sort header for Date */
  readonly dateSortHeader: Locator;

  constructor(private page: Page) {
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.categorySelect = page
      .locator('form, .grid')
      .filter({ has: page.getByPlaceholder('Description') })
      .locator('select')
      .first();
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilterSelect = page.locator('select').last();
    this.transactionRows = page.locator('tbody tr');
    this.emptyState = page.getByText('No transactions found');
    this.footerSummary = page.locator('div').filter({ hasText: /transaction/ }).filter({ hasText: /Total:/ }).last();
    this.amountSortHeader = page.getByText('Amount', { exact: false }).and(page.locator('th'));
    this.dateSortHeader = page.getByText('Date', { exact: false }).and(page.locator('th'));
  }

  /** Navigate to the Expenses tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
    await this.addExpenseButton.waitFor({ state: 'visible' });
  }

  /**
   * Open the add-expense form, fill in the fields, and click Save.
   * Category defaults to 'Food' if omitted (matches app default).
   */
  async addExpense(description: string, amount: string, category?: string) {
    await this.addExpenseButton.click();
    await this.descriptionInput.waitFor({ state: 'visible' });
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    if (category) {
      // The category <select> is the first select inside the add-expense form area
      await this.page
        .locator('select')
        .filter({ has: this.page.locator('option', { hasText: category }) })
        .first()
        .selectOption(category);
    }
    await this.saveButton.click();
    // Form should close after save
    await this.descriptionInput.waitFor({ state: 'hidden' });
  }

  /** Type into the search box to filter visible transactions. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category in the category filter dropdown. */
  async filterByCategory(category: string) {
    // The category filter select is the second select on the page (after the form's select, if open)
    await this.page.locator('select').last().selectOption(category);
  }
}
