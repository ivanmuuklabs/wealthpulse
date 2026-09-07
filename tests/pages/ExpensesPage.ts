import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the Expenses tab.
 * Covers: transaction list, search/filter, sort controls, and add-expense form.
 */
export class ExpensesPage {
  readonly heading: Locator;
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly transactionRows: Locator;
  readonly noResultsMessage: Locator;
  readonly totalLabel: Locator;
  readonly transactionCountLabel: Locator;

  // Add-expense form fields
  readonly formDateInput: Locator;
  readonly formDescriptionInput: Locator;
  readonly formAmountInput: Locator;
  readonly formCategorySelect: Locator;
  readonly formSaveButton: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').filter({ hasText: /all categories/i });
    // Each data row in the transactions table (excludes the header row)
    this.transactionRows = page.locator('tbody tr').filter({ hasNotText: 'No transactions found' });
    this.noResultsMessage = page.getByText('No transactions found');
    // Footer summary labels
    this.totalLabel = page.locator('text=/Total:/');
    this.transactionCountLabel = page.locator('text=/transaction/');

    // Form fields (only rendered when form is open)
    this.formDateInput = page.locator('input[type="date"]');
    this.formDescriptionInput = page.getByPlaceholder('Description');
    this.formAmountInput = page.getByPlaceholder('Amount');
    this.formCategorySelect = page.locator('select').filter({ hasText: /housing/i });
    this.formSaveButton = page.getByRole('button', { name: 'Save' });
  }

  /** Navigate to the Expenses section via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  /** Open the add-expense form. */
  async openAddForm() {
    await this.addExpenseButton.click();
  }

  /** Fill and submit the add-expense form. */
  async addExpense(description: string, amount: string, category: string, date?: string) {
    if (date) await this.formDateInput.fill(date);
    await this.formDescriptionInput.fill(description);
    await this.formAmountInput.fill(amount);
    await this.formCategorySelect.selectOption(category);
    await this.formSaveButton.click();
  }

  /** Type into the search box. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the filter dropdown. */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  /** Click a column header to sort. */
  async sortByColumn(column: 'Date' | 'Category' | 'Amount') {
    await this.page.getByRole('columnheader', { name: column }).click();
  }
}
