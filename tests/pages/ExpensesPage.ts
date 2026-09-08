import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Expenses tab.
 * Encapsulates selectors and interactions for adding expenses,
 * searching/filtering transactions, and reading the table.
 */
export class ExpensesPage {
  readonly heading: Locator;
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categorySelect: Locator;
  readonly transactionTable: Locator;
  readonly emptyState: Locator;
  readonly transactionCount: Locator;

  // Add-expense form fields
  readonly formDescription: Locator;
  readonly formAmount: Locator;
  readonly formCategory: Locator;
  readonly formSaveButton: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput = page.getByPlaceholder('Search transactions…');
    // Category filter dropdown (the one labelled "All Categories")
    this.categorySelect = page.locator('select').filter({ hasText: 'All Categories' });
    this.transactionTable = page.locator('table');
    this.emptyState = page.getByText('No transactions found');
    // Footer count row: "N transaction(s)"
    this.transactionCount = page.locator('span', { hasText: /\d+ transaction/ });

    this.formDescription = page.getByPlaceholder('Description');
    this.formAmount = page.getByPlaceholder('Amount');
    // The category select inside the form (first select with category options inside the form card)
    this.formCategory = page.locator('form select, .grid select').last();
    this.formSaveButton = page.getByRole('button', { name: 'Save' });
  }

  /** Navigate to the Expenses tab from within the app. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  /** Open the add-expense form (click "Add Expense"). */
  async openAddForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fill and submit the add-expense form.
   * @param description  Transaction description text.
   * @param amount       Numeric amount as a string (e.g. "42.50").
   */
  async addExpense(description: string, amount: string) {
    await this.formDescription.fill(description);
    await this.formAmount.fill(amount);
    await this.formSaveButton.click();
  }

  /** Type in the search box to filter transactions. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Clear the search box. */
  async clearSearch() {
    await this.searchInput.clear();
  }
}
