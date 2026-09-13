import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Expenses tab.
 *
 * Covers:
 *  - Navigating to the tab
 *  - Opening / using the "Add Expense" form
 *  - Searching and filtering transactions
 *  - Reading the transaction table and footer totals
 */
export class ExpensesPage {
  // Navigation
  readonly navButton: Locator;

  // "Add Expense" toggle button and form fields
  readonly addExpenseButton: Locator;
  readonly dateInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;

  // Filters
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;

  // Table
  readonly tableRows: Locator;
  readonly emptyState: Locator;
  readonly footerCount: Locator;
  readonly footerTotal: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /expenses/i });

    // The Add Expense toggle button is labelled "Add Expense" or "Cancel"
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    // Form inputs inside the "New Expense" card
    this.dateInput = page.locator('input[type="date"]');
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.categorySelect = page.locator('select').first();
    this.saveButton = page.getByRole('button', { name: 'Save' });

    // Filters
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').nth(1);

    // Table body rows (exclude header)
    this.tableRows = page.locator('tbody tr').filter({ hasNotText: 'No transactions found' });
    this.emptyState = page.getByText('No transactions found');
    this.footerCount = page.locator('div').filter({ hasText: /^\d+ transactions?$/ }).last();
    this.footerTotal = page.locator('span.text-white.font-semibold').last();
  }

  async navigate() {
    await this.navButton.click();
  }

  /** Open the Add Expense form */
  async openAddForm() {
    await this.addExpenseButton.click();
  }

  /** Fill and submit the Add Expense form */
  async addExpense(date: string, description: string, amount: number, category: string) {
    await this.dateInput.fill(date);
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(String(amount));
    await this.categorySelect.selectOption(category);
    await this.saveButton.click();
  }

  /** Type in the search box */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Pick a category from the filter dropdown */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }
}
