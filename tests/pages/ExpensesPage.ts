import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 *
 * Encapsulates all locators and interactions for the Expenses section,
 * including the transaction table, search/filter controls, the
 * "Add Expense" form, and month selectors.
 */
export class ExpensesPage {
  readonly heading: Locator;
  readonly addExpenseButton: Locator;

  // Add-expense form
  readonly formDateInput: Locator;
  readonly formDescriptionInput: Locator;
  readonly formAmountInput: Locator;
  readonly formCategorySelect: Locator;
  readonly formSaveButton: Locator;

  // Filter controls
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;

  // Transaction table
  readonly transactionRows: Locator;
  readonly noTransactionsMessage: Locator;
  readonly footerTransactionCount: Locator;
  readonly footerTotal: Locator;

  // Column sort headers
  readonly sortDateHeader: Locator;
  readonly sortAmountHeader: Locator;
  readonly sortCategoryHeader: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    // Form fields (visible only when form is open)
    this.formDateInput = page.locator('input[type="date"]');
    this.formDescriptionInput = page.getByPlaceholder('Description');
    this.formAmountInput = page.getByPlaceholder('Amount');
    this.formCategorySelect = page.locator('select').filter({ hasText: 'Food' }).first();
    this.formSaveButton = page.getByRole('button', { name: /^save$/i });

    // Filters
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').filter({ hasText: 'All Categories' });

    // Table rows (data rows only, not header)
    this.transactionRows = page.locator('tbody tr').filter({ hasNot: page.locator('td[colspan]') });
    this.noTransactionsMessage = page.getByText('No transactions found');
    this.footerTransactionCount = page.locator('div').filter({ hasText: /^\d+ transactions?$/ }).last();
    this.footerTotal = page.locator('div').filter({ hasText: /^Total:/ }).last();

    // Sort column headers
    this.sortDateHeader = page.getByText('Date', { exact: false }).locator('..').filter({ hasText: /^Date/ });
    this.sortAmountHeader = page.getByText('Amount', { exact: false }).locator('..').filter({ hasText: /^Amount/ });
    this.sortCategoryHeader = page.getByText('Category', { exact: false }).locator('..').filter({ hasText: /^Category/ });
  }

  /** Navigate to the Expenses tab via sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Open the Add Expense form. */
  async openAddForm() {
    await this.addExpenseButton.click();
    await this.formDescriptionInput.waitFor({ state: 'visible' });
  }

  /**
   * Fill and submit the Add Expense form.
   * @param description - transaction description
   * @param amount      - numeric amount (positive)
   * @param category    - one of the 8 category names (e.g. "Food")
   * @param date        - ISO date string (YYYY-MM-DD); defaults to 2026-03-15
   */
  async addExpense(description: string, amount: number, category: string, date = '2026-03-15') {
    await this.openAddForm();
    await this.formDateInput.fill(date);
    await this.formDescriptionInput.fill(description);
    await this.formAmountInput.fill(String(amount));
    await this.formCategorySelect.selectOption(category);
    await this.formSaveButton.click();
  }

  /** Type into the search box. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the category filter dropdown. */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  /** Click a sort column header. */
  async clickSortHeader(column: 'Date' | 'Amount' | 'Category') {
    const header = this.page.locator('th').filter({ hasText: new RegExp(`^${column}`) });
    await header.click();
  }
}
