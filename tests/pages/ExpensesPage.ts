import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 *
 * Covers:
 *  - "Add Expense" button and inline form
 *  - Search input ("Search transactions…")
 *  - Category filter <select>
 *  - Sortable table headers (Date, Category, Amount)
 *  - Transaction rows and the footer summary
 */
export class ExpensesPage {
  readonly heading: Locator;
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categorySelect: Locator;
  readonly tableRows: Locator;
  readonly noResultsRow: Locator;
  readonly footerTransactionCount: Locator;

  // Add-expense form fields
  readonly formDescription: Locator;
  readonly formAmount: Locator;
  readonly formCategory: Locator;
  readonly formSaveButton: Locator;

  constructor(private page: Page) {
    this.heading         = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput     = page.getByPlaceholder('Search transactions…');
    this.categorySelect  = page.locator('select').filter({ hasText: 'All Categories' });

    // Table body rows (exclude the header row)
    this.tableRows       = page.locator('tbody tr').filter({ hasNot: page.locator('td[colspan]') });
    this.noResultsRow    = page.getByText('No transactions found');

    // Footer summary row
    this.footerTransactionCount = page.locator('span').filter({ hasText: /transaction/ }).first();

    // Inline add-expense form fields
    this.formDescription  = page.getByPlaceholder('Description');
    this.formAmount       = page.getByPlaceholder('Amount');
    this.formCategory     = page.locator('select').filter({ hasText: 'Food' });
    this.formSaveButton   = page.getByRole('button', { name: 'Save' });
  }

  /** Navigate to the Expenses section via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Click the "Add Expense" button to reveal the inline form. */
  async openAddExpenseForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fill in the add-expense form and save.
   * Assumes the form is already open.
   */
  async addExpense(description: string, amount: string, category?: string) {
    await this.formDescription.fill(description);
    await this.formAmount.fill(amount);
    if (category) {
      await this.formCategory.selectOption(category);
    }
    await this.formSaveButton.click();
  }

  /** Type into the search box. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the filter dropdown. */
  async filterByCategory(category: string) {
    await this.categorySelect.selectOption(category);
  }

  /** Click a sortable column header by its visible text. */
  async sortBy(column: 'Date' | 'Category' | 'Amount') {
    await this.page.getByRole('columnheader', { name: new RegExp(column, 'i') }).click();
  }
}
