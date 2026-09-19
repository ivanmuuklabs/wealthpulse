import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 *
 * Encapsulates locators and interactions for:
 * - The "Add Expense" form (open/fill/save)
 * - The search input and category filter
 * - The transactions table rows and footer totals
 * - Column sort headers
 */
export class ExpensesPage {
  /** "Add Expense" toggle button in the header */
  readonly addExpenseButton: Locator;

  /** The inline "New Expense" form card (visible after clicking Add Expense) */
  readonly expenseForm: Locator;

  /** Description text input inside the form */
  readonly descriptionInput: Locator;

  /** Amount numeric input inside the form */
  readonly amountInput: Locator;

  /** Category select inside the form */
  readonly categorySelect: Locator;

  /** "Save" button inside the form */
  readonly saveButton: Locator;

  /** Search transactions input */
  readonly searchInput: Locator;

  /** Category filter select (All Categories / specific category) */
  readonly categoryFilter: Locator;

  /** All visible transaction rows in the table body */
  readonly transactionRows: Locator;

  /** Footer text showing "N transactions" */
  readonly transactionCount: Locator;

  /** "No transactions found" empty state cell */
  readonly emptyState: Locator;

  /** "Date" sort header */
  readonly dateSortHeader: Locator;

  /** "Amount" sort header */
  readonly amountSortHeader: Locator;

  constructor(private page: Page) {
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.expenseForm = page.locator('text=New Expense').locator('..');
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.categorySelect = page.locator('select').filter({ hasText: /food|housing|transport/i }).first();
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').filter({ hasText: /all categories/i });
    this.transactionRows = page.locator('tbody tr').filter({ hasNotText: 'No transactions found' });
    this.transactionCount = page.locator('span', { hasText: /transaction/ }).filter({ hasText: /^\d/ });
    this.emptyState = page.getByText('No transactions found');
    this.dateSortHeader = page.getByText('Date', { exact: false }).locator('xpath=ancestor::th');
    this.amountSortHeader = page.getByText('Amount', { exact: false }).locator('xpath=ancestor::th');
  }

  /** Navigate to the Expenses module via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
    await this.page.getByRole('heading', { name: 'Expenses' }).waitFor();
  }

  /** Open the Add Expense form. */
  async openAddExpenseForm() {
    await this.addExpenseButton.click();
    await this.descriptionInput.waitFor();
  }

  /**
   * Fill and submit the Add Expense form.
   * @param description Transaction description text
   * @param amount      Dollar amount (as a string, e.g. "42.50")
   */
  async addExpense(description: string, amount: string) {
    await this.openAddExpenseForm();
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    await this.saveButton.click();
  }

  /** Type into the search box and let the table filter reactively. */
  async searchTransactions(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category in the filter dropdown. */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }
}
