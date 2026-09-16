import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 *
 * Covers: month selector, search input, category filter dropdown,
 * Add Expense button & form (description, amount, category, save),
 * transaction table rows, empty-state, and footer totals.
 */
export class ExpensesPage {
  readonly expensesHeading: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly addExpenseButton: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;
  readonly tableRows: Locator;
  readonly emptyState: Locator;
  readonly footerTransactionCount: Locator;
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  constructor(private page: Page) {
    this.expensesHeading = page.getByRole('heading', { name: /expenses/i }).first();

    // Filters
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').filter({ hasText: 'All Categories' });

    // Add Expense
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.categorySelect = page
      .locator('form, .rounded-2xl')
      .filter({ hasText: 'New Expense' })
      .locator('select')
      .first();
    this.saveButton = page.getByRole('button', { name: /^save$/i });

    // Table
    this.tableRows = page.locator('tbody tr').filter({ hasNotText: 'No transactions found' });
    this.emptyState = page.getByText('No transactions found');

    // Footer
    this.footerTransactionCount = page.locator('div').filter({ hasText: /\d+ transactions?/ }).last();

    // Month buttons
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });
  }

  /** Navigate to the Expenses tab from the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
    await this.expensesHeading.waitFor({ state: 'visible' });
  }

  /** Click the Add Expense button to reveal the form. */
  async openAddForm() {
    await this.addExpenseButton.click();
    await this.descriptionInput.waitFor({ state: 'visible' });
  }

  /** Fill and submit the Add Expense form. */
  async addExpense(description: string, amount: string, category = 'Food') {
    await this.openAddForm();
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    // Select category in the inline form select
    await this.page
      .locator('.rounded-2xl')
      .filter({ hasText: 'New Expense' })
      .locator('select')
      .selectOption(category);
    await this.saveButton.click();
  }

  /** Type into the search input. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Clear the search input. */
  async clearSearch() {
    await this.searchInput.clear();
  }

  /** Select a category from the filter dropdown. */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  /** Click a month button by name. */
  async selectMonth(name: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name }).click();
  }
}
