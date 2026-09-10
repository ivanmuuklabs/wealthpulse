import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 *
 * Encapsulates all locators and interaction helpers for the expenses list,
 * add-expense form, search bar, category filter, sort controls, and table footer.
 */
export class ExpensesPage {
  readonly heading: Locator;
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;

  // Add-expense form fields
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly saveButton: Locator;
  readonly categorySelect: Locator;

  // Table and footer
  readonly tableRows: Locator;
  readonly emptyState: Locator;
  readonly footerTotal: Locator;
  readonly footerCount: Locator;

  // Sort column headers
  readonly dateHeader: Locator;
  readonly amountHeader: Locator;
  readonly categoryHeader: Locator;

  constructor(private page: Page) {
    this.heading           = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton  = page.getByRole('button', { name: /add expense/i });
    this.searchInput       = page.getByPlaceholder('Search transactions…');
    this.categoryFilter    = page.locator('select').filter({ hasText: 'All Categories' });

    // Form fields (visible only when form is open)
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput      = page.getByPlaceholder('Amount');
    this.saveButton       = page.getByRole('button', { name: 'Save' });
    this.categorySelect   = page.locator('select').filter({ hasText: 'Food' }).first();

    // Table body rows
    this.tableRows  = page.locator('tbody tr').filter({ hasNot: page.locator('td[colspan]') });
    this.emptyState = page.getByText('No transactions found');

    // Footer
    this.footerTotal = page.locator('text=/Total:/').locator('..');
    this.footerCount = page.locator('text=/transaction/').first();

    // Sort headers
    this.dateHeader     = page.getByText('Date').first();
    this.amountHeader   = page.getByText('Amount').first();
    this.categoryHeader = page.getByText('Category').first();
  }

  /** Navigate to Expenses via the sidebar button. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  /** Open the add-expense form by clicking "Add Expense". */
  async openAddForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fill and save a new expense.
   * @param description - Transaction description
   * @param amount      - Numeric amount (e.g. 42.50)
   * @param category    - Category name (default: 'Food')
   */
  async addExpense(description: string, amount: number | string, category = 'Food') {
    await this.openAddForm();
    await this.descriptionInput.fill(String(description));
    await this.amountInput.fill(String(amount));
    // Select the matching category option in the form select
    await this.page
      .locator('select')
      .nth(1) // second select in the page (first is the category filter)
      .selectOption(category);
    await this.saveButton.click();
  }

  /** Type into the search bar. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Clear the search bar. */
  async clearSearch() {
    await this.searchInput.clear();
  }

  /** Select a category in the filter dropdown (pass 'All' to reset). */
  async filterByCategory(category: string) {
    await this.page.locator('select').first().selectOption(category);
  }

  /** Click the Month button (Jan / Feb / Mar). */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }
}
