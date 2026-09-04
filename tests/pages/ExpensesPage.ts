import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Expenses tab.
 *
 * Covers the add-expense form, the search/filter bar, the sortable
 * transaction table, and the summary footer.
 */
export class ExpensesPage {
  // Sidebar nav button that opens this tab
  readonly navButton: Locator;

  // Page heading
  readonly heading: Locator;

  // "Add Expense" toggle button
  readonly addExpenseButton: Locator;

  // Add-expense form fields (visible after clicking addExpenseButton)
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;

  // Search and filter controls
  readonly searchInput: Locator;
  readonly categoryFilterSelect: Locator;

  // Transaction table body rows
  readonly tableRows: Locator;

  // Footer summary text (e.g. "18 transactions  Total: $1,234.56")
  readonly transactionCount: Locator;

  // Empty state cell shown when no rows match
  readonly emptyState: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /expenses/i });
    this.heading = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    // Form fields (inside the "New Expense" card that appears after clicking Add Expense)
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.categorySelect = page.locator('select').filter({ hasText: /Food/ }).first();
    this.saveButton = page.getByRole('button', { name: /^Save$/ });

    // Filters
    this.searchInput = page.getByPlaceholder('Search transactions…');
    // The category filter dropdown — distinct from the form's category select
    this.categoryFilterSelect = page.locator('select').filter({ hasText: /All Categories/ });

    // Table rows (data rows only, not the header)
    this.tableRows = page.locator('tbody tr');

    // Footer showing count
    this.transactionCount = page.locator('div').filter({ hasText: /\d+ transaction/ }).last();

    // Empty state
    this.emptyState = page.getByText('No transactions found');
  }

  /** Navigate to the Expenses tab via the sidebar. */
  async navigate() {
    await this.navButton.click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Open the add-expense form. */
  async openAddForm() {
    await this.addExpenseButton.click();
    await this.descriptionInput.waitFor({ state: 'visible' });
  }

  /**
   * Fill and submit the add-expense form.
   * @param description  Transaction description text
   * @param amount       Numeric amount (e.g. 42.50)
   * @param category     One of the 8 CATEGORIES strings (default: 'Food')
   */
  async addExpense(description: string, amount: number, category = 'Food') {
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(String(amount));
    await this.categorySelect.selectOption(category);
    await this.saveButton.click();
  }

  /** Type into the search field to filter transactions. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the filter dropdown. */
  async filterByCategory(category: string) {
    await this.categoryFilterSelect.selectOption(category);
  }
}
