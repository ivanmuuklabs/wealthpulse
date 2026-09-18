import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 *
 * Covers: Add Expense form, search input, category filter dropdown,
 * and the transactions table body.
 */
export class ExpensesPage {
  // "Add Expense" toggle button
  readonly addExpenseButton: Locator;

  // Add expense form fields
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;

  // Filters
  readonly searchInput: Locator;
  readonly categoryFilterSelect: Locator;

  // Table
  readonly tableRows: Locator;
  readonly emptyState: Locator;

  // Footer totals line
  readonly tableFooter: Locator;

  constructor(private page: Page) {
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    // Form fields inside the "New Expense" card
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput      = page.getByPlaceholder('Amount');
    this.categorySelect   = page.locator('select').filter({ hasText: /Food/ }).first();
    this.saveButton       = page.getByRole('button', { name: 'Save' });

    // Filters
    this.searchInput          = page.getByPlaceholder('Search transactions…');
    this.categoryFilterSelect = page.locator('select').filter({ hasText: /All Categories/ });

    // Table body rows (each visible transaction row)
    this.tableRows  = page.locator('tbody tr').filter({ hasNot: page.locator('td[colspan]') });
    this.emptyState = page.getByText('No transactions found');

    this.tableFooter = page.locator('div').filter({ hasText: /^[0-9]+ transaction/ }).last();
  }

  /** Navigate to the Expenses tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
    await this.page.getByRole('heading', { name: 'Expenses' }).waitFor({ state: 'visible' });
  }

  /** Open the Add Expense form (if not already open). */
  async openAddForm() {
    await this.addExpenseButton.click();
    await this.descriptionInput.waitFor({ state: 'visible' });
  }

  /** Fill in and submit the Add Expense form. */
  async addExpense(description: string, amount: string, category: string = 'Food') {
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    // Select the right category in the form's category <select>
    await this.page
      .locator('div').filter({ hasText: /^New Expense$/ })
      .locator('..')
      .locator('select')
      .selectOption(category);
    await this.saveButton.click();
  }

  /** Type into the search box to filter transactions. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category in the category filter dropdown. */
  async filterByCategory(category: string) {
    await this.categoryFilterSelect.selectOption(category);
  }
}
