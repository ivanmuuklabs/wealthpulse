import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 *
 * Key features exercised here:
 * - Month switching (same MonthButton as Dashboard)
 * - "Add Expense" form: description, amount, category, Save
 * - Search input for filtering transactions
 * - Category filter dropdown
 * - Transaction table (rows, empty state)
 */
export class ExpensesPage {
  readonly navButton: Locator;
  readonly heading: Locator;
  /** "Add Expense" primary action button (opens the form) */
  readonly addExpenseButton: Locator;
  /** Description input inside the add-expense form */
  readonly descriptionInput: Locator;
  /** Amount input inside the add-expense form */
  readonly amountInput: Locator;
  /** Category select inside the add-expense form */
  readonly categorySelect: Locator;
  /** Save button inside the add-expense form */
  readonly saveButton: Locator;
  /** Search input for filtering the transaction list */
  readonly searchInput: Locator;
  /** Category filter dropdown above the table */
  readonly categoryFilter: Locator;
  /** All data rows in the transaction table (excludes empty-state row) */
  readonly transactionRows: Locator;
  /** Empty-state message shown when no transactions match the filter */
  readonly emptyState: Locator;
  /** Footer transaction count label */
  readonly transactionCount: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /expenses/i });
    this.heading = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    // Form fields — visible only after Add Expense is clicked
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.categorySelect = page.locator('select').filter({ hasText: /Food/ }).first();
    this.saveButton = page.getByRole('button', { name: 'Save' });

    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').filter({ hasText: /All Categories/ });
    // Rows in the tbody that are NOT the empty-state row
    this.transactionRows = page.locator('tbody tr').filter({ hasNot: page.locator('td[colspan]') });
    this.emptyState = page.getByText('No transactions found');
    this.transactionCount = page.locator('text=/\\d+ transaction/');
  }

  /** Click the sidebar Expenses button to navigate here */
  async navigate() {
    await this.navButton.click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Open the add-expense form, fill all fields, and submit */
  async addExpense(description: string, amount: string, category?: string) {
    await this.addExpenseButton.click();
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    if (category) {
      await this.categorySelect.selectOption(category);
    }
    await this.saveButton.click();
  }

  /** Type into the search box to filter the transaction list */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the filter dropdown */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }
}
