import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 * Covers: add expense flow, search/filter, and column sorting.
 */
export class ExpensesPage {
  /** "Add Expense" toggle button */
  readonly addExpenseButton: Locator;

  /** Search input in the filter bar */
  readonly searchInput: Locator;

  /** Category filter <select> */
  readonly categoryFilter: Locator;

  /** Inline form inputs (only visible when form is open) */
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;

  /** Transaction table rows (tbody rows only) */
  readonly tableRows: Locator;

  /** "No transactions found" empty-state cell */
  readonly emptyState: Locator;

  /** Footer summary — transaction count text */
  readonly footerCount: Locator;

  /** Clickable column headers for sorting */
  readonly dateHeader: Locator;
  readonly categoryHeader: Locator;
  readonly amountHeader: Locator;

  constructor(private page: Page) {
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput      = page.getByPlaceholder('Search transactions…');
    this.categoryFilter   = page.locator('select').first();

    // Form fields — rendered conditionally
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput      = page.getByPlaceholder('Amount');
    this.categorySelect   = page.locator('form, .\\!border-emerald-500\\/20').locator('select').first();
    this.saveButton       = page.getByRole('button', { name: 'Save' });

    this.tableRows   = page.locator('tbody tr:not(:has(td[colspan]))');
    this.emptyState  = page.getByText('No transactions found');
    this.footerCount = page.locator('.px-5.py-3.border-t span').first();

    // Column sort headers — identified by their text content
    this.dateHeader     = page.getByRole('columnheader', { name: /date/i });
    this.categoryHeader = page.getByRole('columnheader', { name: /category/i });
    this.amountHeader   = page.getByRole('columnheader', { name: /amount/i });
  }

  /** Navigate to the Expenses tab via the sidebar */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  /** Open the Add Expense form (idempotent — checks visibility first) */
  async openAddForm() {
    const formVisible = await this.descriptionInput.isVisible().catch(() => false);
    if (!formVisible) {
      await this.addExpenseButton.click();
    }
  }

  /** Fill and submit the add-expense form */
  async addExpense(description: string, amount: string, category: string) {
    await this.openAddForm();
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    // Select the category from the inline form select (not the filter select)
    await this.page
      .locator('.\\!border-emerald-500\\/20, [class*="border-emerald-500"]')
      .locator('select')
      .selectOption(category);
    await this.saveButton.click();
  }

  /** Type into the search box */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the filter dropdown */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  /** Click a column header to toggle sort */
  async sortBy(column: 'date' | 'category' | 'amount') {
    const map = { date: this.dateHeader, category: this.categoryHeader, amount: this.amountHeader };
    await map[column].click();
  }
}
