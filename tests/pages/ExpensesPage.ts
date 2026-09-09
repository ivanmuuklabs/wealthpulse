import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 *
 * Encapsulates all locators and interactions for the expense management
 * section, including the transaction table, search/filter controls, and
 * the add-expense form.
 */
export class ExpensesPage {
  // Navigation
  readonly navButton: Locator;

  // Header / controls
  readonly heading: Locator;
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;

  // Add-expense form
  readonly formDateInput: Locator;
  readonly formDescriptionInput: Locator;
  readonly formAmountInput: Locator;
  readonly formCategorySelect: Locator;
  readonly formSaveButton: Locator;

  // Transaction table
  readonly transactionRows: Locator;
  readonly emptyStateCell: Locator;
  readonly transactionCount: Locator;
  readonly transactionTotal: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /expenses/i });

    this.heading = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').filter({ hasText: 'All Categories' });

    // The form fields appear after "Add Expense" is clicked
    this.formDateInput = page.locator('input[type="date"]');
    this.formDescriptionInput = page.getByPlaceholder('Description');
    this.formAmountInput = page.getByPlaceholder('Amount');
    this.formCategorySelect = page.locator('select').filter({ hasText: 'Food' }).first();
    this.formSaveButton = page.getByRole('button', { name: 'Save' });

    // Table body rows (cells that contain a date-like string)
    this.transactionRows = page.locator('tbody tr').filter({ hasNotText: 'No transactions found' });
    this.emptyStateCell = page.getByText('No transactions found');
    this.transactionCount = page.locator('div').filter({ hasText: /^\d+ transactions?$/ }).first();
    this.transactionTotal = page.locator('div').filter({ hasText: /Total:/ }).first();
  }

  /** Navigate to the Expenses section from within the app. */
  async navigate() {
    await this.navButton.click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Open the add-expense form panel. */
  async openAddForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fill and submit the add-expense form.
   * @param description - transaction description
   * @param amount      - numeric amount (as a string)
   * @param category    - category option value (default: "Food")
   */
  async addExpense(description: string, amount: string, category = 'Food') {
    await this.formDescriptionInput.fill(description);
    await this.formAmountInput.fill(amount);
    if (category !== 'Food') {
      await this.formCategorySelect.selectOption(category);
    }
    await this.formSaveButton.click();
  }

  /** Filter the table by typing in the search box. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the filter dropdown. */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }
}
