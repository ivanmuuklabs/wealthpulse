import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Waste tab (formerly "Expenses").
 * Encapsulates all locators and interaction helpers for the renamed section.
 */
export class WastePage {
  /** The sidebar nav button that navigates to the Waste section */
  readonly sidebarButton: Locator;
  /** The main page heading inside the Waste tab */
  readonly heading: Locator;
  /** Month-selector buttons row */
  readonly monthButtons: Locator;
  /** The transaction table body rows */
  readonly tableRows: Locator;
  /** Empty-state cell shown when no transactions match */
  readonly emptyState: Locator;
  /** "Add Expense" button that opens the add-expense form */
  readonly addExpenseButton: Locator;
  /** Search input for filtering transactions */
  readonly searchInput: Locator;
  /** Category dropdown for filtering by a specific category */
  readonly categorySelect: Locator;
  /** "New Expense" form card — visible only when the form is open */
  readonly addExpenseForm: Locator;
  /** Description text input inside the add-expense form */
  readonly formDescriptionInput: Locator;
  /** Amount number input inside the add-expense form */
  readonly formAmountInput: Locator;
  /** Category select inside the add-expense form */
  readonly formCategorySelect: Locator;
  /** Save button inside the add-expense form */
  readonly formSaveButton: Locator;
  /** Footer row showing transaction count and total */
  readonly footerRow: Locator;
  /** "Date" column header (clickable for sorting) */
  readonly dateColumnHeader: Locator;
  /** "Amount" column header (clickable for sorting) */
  readonly amountColumnHeader: Locator;
  /** "Category" column header (clickable for sorting) */
  readonly categoryColumnHeader: Locator;

  constructor(private page: Page) {
    this.sidebarButton = page.getByRole('button', { name: 'Waste' });
    this.heading = page.getByRole('heading', { name: 'Waste', level: 2 });
    // Month buttons sit inside a flex container; they render as plain <button> elements
    // with a short month label (Jan, Feb, Mar, Apr)
    this.monthButtons = page
      .locator('div.flex.bg-white\\/\\[0\\.04\\]')
      .filter({ has: page.getByRole('button', { name: 'Jan' }) })
      .getByRole('button');
    this.tableRows = page.locator('table tbody tr');
    this.emptyState = page.getByText('No transactions found');
    this.addExpenseButton = page.getByRole('button', { name: 'Add Expense' });
    // Search input uses a placeholder; SearchInput component renders a plain <input>
    this.searchInput = page.getByPlaceholder('Search transactions…');
    // Category filter: a <select> with "All Categories" as the default option
    this.categorySelect = page.getByRole('combobox').first();
    // Add-expense form card identified by its heading
    this.addExpenseForm = page.getByText('New Expense');
    // Form fields inside the add-expense card
    this.formDescriptionInput = page.getByPlaceholder('Description');
    this.formAmountInput = page.getByPlaceholder('Amount');
    this.formCategorySelect = page.getByRole('combobox').nth(1);
    this.formSaveButton = page.getByRole('button', { name: 'Save' });
    // Table footer (count + total line at bottom of the card)
    this.footerRow = page.locator('table').locator('..').locator('..').locator('div').filter({ hasText: /transaction/ }).last();
    // Sortable column headers
    this.dateColumnHeader = page.getByRole('columnheader', { name: /date/i });
    this.amountColumnHeader = page.getByRole('columnheader', { name: /amount/i });
    this.categoryColumnHeader = page.getByRole('columnheader', { name: /category/i });
  }

  /** Navigate to the Waste tab via the sidebar button */
  async navigate() {
    await this.sidebarButton.click();
    await this.page.waitForSelector('h2', { state: 'visible' });
  }

  /** Click a month button by its visible label (e.g. 'Apr') */
  async selectMonth(label: 'Jan' | 'Feb' | 'Mar' | 'Apr') {
    await this.page.getByRole('button', { name: label, exact: true }).click();
  }

  /** Type a search term into the search input */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the category dropdown filter */
  async filterByCategory(category: string) {
    await this.categorySelect.selectOption(category);
  }

  /** Open the add-expense form (if not already open) */
  async openAddExpenseForm() {
    await this.addExpenseButton.click();
    await this.page.getByText('New Expense').waitFor({ state: 'visible' });
  }

  /**
   * Fill and submit the add-expense form.
   * @param description  Transaction description text
   * @param amount       Numeric amount (as a string, e.g. "42.50")
   * @param category     Optional category value; defaults to "Food"
   */
  async addExpense(description: string, amount: string, category = 'Food') {
    await this.formDescriptionInput.fill(description);
    await this.formAmountInput.fill(amount);
    await this.formCategorySelect.selectOption(category);
    await this.formSaveButton.click();
  }
}
