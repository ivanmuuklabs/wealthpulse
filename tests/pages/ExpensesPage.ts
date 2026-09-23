import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Expenses section.
 * Covers month selector, add-expense form, search/filter, sort, and table rows.
 */
export class ExpensesPage {
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilterDropdown: Locator;
  readonly tableRows: Locator;
  readonly footerSummary: Locator;

  // Add-expense form fields
  readonly formDate: Locator;
  readonly formDescription: Locator;
  readonly formAmount: Locator;
  readonly formCategory: Locator;
  readonly formSaveButton: Locator;

  // Sort column headers
  readonly sortByDate: Locator;
  readonly sortByCategory: Locator;
  readonly sortByAmount: Locator;

  constructor(private page: Page) {
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput      = page.getByPlaceholder(/search/i);
    this.categoryFilterDropdown = page.getByRole('combobox').first();
    // Table body rows — each expense row contains an amount formatted as $X.XX
    this.tableRows   = page.locator('tbody tr');
    this.footerSummary = page.locator('tfoot tr, [data-testid="table-footer"]').first();

    // Form fields (visible only after clicking Add Expense)
    this.formDate        = page.getByLabel(/date/i);
    this.formDescription = page.getByLabel(/description/i);
    this.formAmount      = page.getByLabel(/amount/i);
    this.formCategory    = page.getByLabel(/category/i);
    this.formSaveButton  = page.getByRole('button', { name: /save/i });

    // Column header sort buttons
    this.sortByDate     = page.getByRole('button', { name: /date/i });
    this.sortByCategory = page.getByRole('button', { name: /category/i });
    this.sortByAmount   = page.getByRole('button', { name: /amount/i });
  }

  /** Navigate to Expenses via sidebar */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
    await this.addExpenseButton.waitFor({ state: 'visible' });
  }

  /** Open the Add Expense inline form */
  async openAddExpenseForm() {
    await this.addExpenseButton.click();
    await this.formDescription.waitFor({ state: 'visible' });
  }

  /**
   * Fill and submit the Add Expense form.
   * @param description - transaction description
   * @param amount - transaction amount as a number
   * @param category - category option text (e.g. 'Food')
   */
  async addExpense(description: string, amount: number, category: string) {
    await this.openAddExpenseForm();
    await this.formDescription.fill(description);
    await this.formAmount.fill(String(amount));
    await this.formCategory.selectOption(category);
    await this.formSaveButton.click();
  }

  /** Type into the search box to filter rows */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the filter dropdown */
  async filterByCategory(category: string) {
    await this.categoryFilterDropdown.selectOption(category);
  }
}
