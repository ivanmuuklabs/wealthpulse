import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Expenses tab.
 *
 * Covers: add-expense form, search/filter, sort controls,
 * and the transaction table — all rendered inside the Expenses section.
 */
export class ExpensesPage {
  readonly heading: Locator;
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly newExpenseForm: Locator;
  readonly dateInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;
  readonly transactionRows: Locator;
  readonly transactionCount: Locator;
  readonly transactionTotal: Locator;
  readonly noTransactionsMessage: Locator;
  readonly dateColumnHeader: Locator;
  readonly categoryColumnHeader: Locator;
  readonly amountColumnHeader: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').filter({ hasText: 'All Categories' });
    this.newExpenseForm = page.getByText('New Expense');
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    // The date and category inputs inside the new-expense form
    this.dateInput = page.locator('input[type="date"]');
    this.categorySelect = page
      .locator('div', { has: page.getByText('New Expense') })
      .locator('select');
    this.saveButton = page.getByRole('button', { name: 'Save' });
    // Table body rows (each real transaction row shows a date, description, category badge, and amount)
    this.transactionRows = page.locator('tbody tr').filter({ hasNotText: 'No transactions found' });
    this.transactionCount = page.locator('footer span').first();
    this.transactionTotal = page.locator('footer span').last();
    this.noTransactionsMessage = page.getByText('No transactions found');
    // Sort-able column headers
    this.dateColumnHeader = page.getByRole('columnheader', { name: /date/i });
    this.categoryColumnHeader = page.getByRole('columnheader', { name: /category/i });
    this.amountColumnHeader = page.getByRole('columnheader', { name: /amount/i });
  }

  /** Navigate to the Expenses section from the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  /** Open the add-expense form if it is not already open. */
  async openForm() {
    await this.addExpenseButton.click();
  }

  /** Fill and submit the new-expense form. */
  async addExpense(description: string, amount: string, category = 'Food', date = '2026-03-15') {
    await this.dateInput.fill(date);
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    await this.categorySelect.selectOption(category);
    await this.saveButton.click();
  }

  /** Filter the table by typing in the search box. */
  async search(query: string) {
    await this.searchInput.fill(query);
  }

  /** Filter by category using the dropdown. */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  /** Click a sortable column header to toggle sort. */
  async sortBy(column: 'date' | 'category' | 'amount') {
    const headers: Record<string, Locator> = {
      date: this.dateColumnHeader,
      category: this.categoryColumnHeader,
      amount: this.amountColumnHeader,
    };
    await headers[column].click();
  }
}
