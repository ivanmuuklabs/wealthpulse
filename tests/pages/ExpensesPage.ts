import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Expenses tab.
 *
 * Covers: transaction table, add-expense form, search/filter, column sort.
 */
export class ExpensesPage {
  readonly heading: Locator;
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly newExpenseForm: Locator;

  // Add-expense form fields
  readonly formDateInput: Locator;
  readonly formDescriptionInput: Locator;
  readonly formAmountInput: Locator;
  readonly formCategorySelect: Locator;
  readonly formSaveButton: Locator;

  // Table
  readonly tableRows: Locator;
  readonly noTransactionsMessage: Locator;
  readonly transactionCount: Locator;
  readonly totalAmount: Locator;

  // Column sort headers
  readonly dateHeader: Locator;
  readonly categoryHeader: Locator;
  readonly amountHeader: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').filter({ hasText: 'All Categories' });
    this.newExpenseForm = page.getByText('New Expense');

    // Form fields inside the add-expense card
    this.formDescriptionInput = page.getByPlaceholder('Description');
    this.formAmountInput = page.getByPlaceholder('Amount');
    this.formDateInput = page.locator('input[type="date"]');
    this.formCategorySelect = page.locator('select').filter({ hasText: 'Food' });
    this.formSaveButton = page.getByRole('button', { name: 'Save' });

    // Table
    this.tableRows = page.locator('tbody tr').filter({ hasNotText: 'No transactions found' });
    this.noTransactionsMessage = page.getByText('No transactions found');
    this.transactionCount = page.locator('div').filter({ hasText: /^\d+ transactions?$/ }).first();
    this.totalAmount = page.locator('span').filter({ hasText: /^Total:/ });

    // Sortable column headers
    this.dateHeader = page.getByRole('columnheader', { name: /date/i });
    this.categoryHeader = page.getByRole('columnheader', { name: /category/i });
    this.amountHeader = page.getByRole('columnheader', { name: /amount/i });
  }

  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  /** Open the add-expense form */
  async openAddForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fill and submit the add-expense form.
   * @param description  Transaction description
   * @param amount       Transaction amount (numeric string, e.g. "99.50")
   * @param category     Category name matching a dropdown option
   */
  async addExpense(description: string, amount: string, category?: string) {
    await this.formDescriptionInput.fill(description);
    await this.formAmountInput.fill(amount);
    if (category) {
      await this.formCategorySelect.selectOption(category);
    }
    await this.formSaveButton.click();
  }

  /** Filter transactions by category using the dropdown */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  /** Type into the search box */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Click a sortable column header */
  async sortBy(column: 'date' | 'category' | 'amount') {
    const map = { date: this.dateHeader, category: this.categoryHeader, amount: this.amountHeader };
    await map[column].click();
  }
}
