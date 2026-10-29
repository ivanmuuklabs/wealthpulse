import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage
 *
 * Encapsulates locators and helpers for the Expenses tab.
 */
export class ExpensesPage {
  readonly heading: Locator;

  // Toolbar
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;

  // Add-expense form (visible only when showForm === true)
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;

  // Table
  readonly tableRows: Locator;        // All data rows (tr) in the transaction table
  readonly emptyState: Locator;       // "No transactions found" cell
  readonly footerCount: Locator;      // "N transactions" label in the card footer

  // Column sort headers
  readonly dateSortHeader: Locator;
  readonly categorySortHeader: Locator;
  readonly amountSortHeader: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Expenses' }).first();

    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.getByRole('combobox');

    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    // The category select inside the add-expense form
    this.categorySelect = page.locator('select').last();
    this.saveButton = page.getByRole('button', { name: /^save$/i });

    // Table rows — tbody > tr elements that contain real data
    this.tableRows = page.locator('tbody tr').filter({ hasNotText: 'No transactions found' });
    this.emptyState = page.getByText('No transactions found');
    this.footerCount = page.locator('text=/\\d+ transaction/');

    this.dateSortHeader = page.getByRole('columnheader', { name: /date/i });
    this.categorySortHeader = page.getByRole('columnheader', { name: /category/i });
    this.amountSortHeader = page.getByRole('columnheader', { name: /amount/i });
  }

  /** Navigate to the Expenses tab via the sidebar nav item. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Open the add-expense form (if not already open). */
  async openAddForm() {
    await this.addExpenseButton.click();
    await this.descriptionInput.waitFor({ state: 'visible' });
  }

  /**
   * Fill and submit the add-expense form.
   * Assumes the form is already open.
   */
  async addExpense(description: string, amount: string, category = 'Food') {
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    // Select the category
    await this.page.selectOption('select', { label: category });
    await this.saveButton.click();
  }

  /** Type in the search box and wait one animation frame. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the category-filter dropdown. */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category === 'All' ? 'All' : category);
  }

  /** Extract the text of the first Amount cell (rightmost column, first data row). */
  async firstRowAmount(): Promise<string> {
    return (await this.tableRows.first().locator('td').last().textContent()) ?? '';
  }
}
