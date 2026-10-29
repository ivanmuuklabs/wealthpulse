import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 *
 * Covers: add-expense form, search filter, category filter,
 * column sort, and the transaction table.
 */
export class ExpensesPage {
  readonly heading: Locator;
  readonly addExpenseButton: Locator;

  // Add-expense form fields
  readonly formDateInput: Locator;
  readonly formDescriptionInput: Locator;
  readonly formAmountInput: Locator;
  readonly formCategorySelect: Locator;
  readonly formSaveButton: Locator;

  // Filters
  readonly searchInput: Locator;
  readonly categoryFilterSelect: Locator;

  // Table
  readonly transactionRows: Locator;
  readonly emptyState: Locator;
  readonly totalLabel: Locator;
  readonly transactionCount: Locator;

  // Column sort headers
  readonly sortByDateHeader: Locator;
  readonly sortByAmountHeader: Locator;
  readonly sortByCategoryHeader: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    // Form — selectors match placeholder/label text in App.jsx
    this.formDateInput = page.locator('input[type="date"]');
    this.formDescriptionInput = page.getByPlaceholder('Description');
    this.formAmountInput = page.getByPlaceholder('Amount');
    this.formCategorySelect = page.locator('select').filter({ hasText: /Housing|Food|Transport/ }).first();
    this.formSaveButton = page.getByRole('button', { name: 'Save' });

    // Filters
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilterSelect = page.locator('select').filter({ hasText: /All Categories/ });

    // Table
    this.transactionRows = page.locator('tbody tr').filter({ hasNotText: 'No transactions found' });
    this.emptyState = page.getByText('No transactions found');
    this.totalLabel = page.locator('text=/Total:/');
    this.transactionCount = page.locator('text=/\\d+ transactions?/');

    // Sort headers (column headings)
    this.sortByDateHeader = page.getByText('Date', { exact: false }).filter({ hasText: 'Date' }).first();
    this.sortByAmountHeader = page.getByText('Amount', { exact: false }).filter({ hasText: 'Amount' }).first();
    this.sortByCategoryHeader = page.getByText('Category', { exact: false }).filter({ hasText: 'Category' }).first();
  }

  /** Navigate to the Expenses tab from any authenticated state */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Open the add-expense form */
  async openAddForm() {
    await this.addExpenseButton.click();
    await this.formDescriptionInput.waitFor({ state: 'visible' });
  }

  /**
   * Fill and submit the add-expense form.
   * Category defaults to 'Food' if not specified.
   */
  async addExpense(description: string, amount: string, category?: string) {
    await this.formDescriptionInput.fill(description);
    await this.formAmountInput.fill(amount);
    if (category) {
      await this.formCategorySelect.selectOption(category);
    }
    await this.formSaveButton.click();
  }

  /** Filter the transaction list by search term */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Filter by a specific category using the dropdown */
  async filterByCategory(category: string) {
    await this.categoryFilterSelect.selectOption(category);
  }

  /** Click a column header to sort */
  async sortByColumn(column: 'date' | 'amount' | 'category') {
    if (column === 'date') await this.sortByDateHeader.click();
    else if (column === 'amount') await this.sortByAmountHeader.click();
    else await this.sortByCategoryHeader.click();
  }

  /** Return all visible amount cell texts in the table */
  async getAmountTexts(): Promise<string[]> {
    return this.page
      .locator('tbody tr td:last-child')
      .allTextContents();
  }
}
