import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Expenses tab.
 *
 * Covers:
 *  - Add Expense form (toggle, fill, save)
 *  - Search / filter bar
 *  - Category filter dropdown
 *  - Sortable table (Date, Category, Amount columns)
 *  - Footer summary (transaction count + total)
 *  - Month selector buttons
 */
export class ExpensesPage {
  // Navigation
  readonly navButton: Locator;

  // Month selector
  readonly monthJan: Locator;
  readonly monthFeb: Locator;
  readonly monthMar: Locator;

  // Add-expense toggle & form
  readonly addExpenseButton: Locator;
  readonly formDateInput: Locator;
  readonly formDescriptionInput: Locator;
  readonly formAmountInput: Locator;
  readonly formCategorySelect: Locator;
  readonly formSaveButton: Locator;

  // Filters
  readonly searchInput: Locator;
  readonly categoryFilterSelect: Locator;

  // Table
  readonly tableRows: Locator;
  readonly noResultsRow: Locator;
  readonly columnHeaderDate: Locator;
  readonly columnHeaderCategory: Locator;
  readonly columnHeaderAmount: Locator;

  // Footer
  readonly footerTransactionCount: Locator;
  readonly footerTotal: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /expenses/i });

    this.monthJan = page.getByRole('button', { name: 'Jan' });
    this.monthFeb = page.getByRole('button', { name: 'Feb' });
    this.monthMar = page.getByRole('button', { name: 'Mar' });

    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    // Form fields (visible only when form is open)
    this.formDateInput = page.locator('input[type="date"]');
    this.formDescriptionInput = page.getByPlaceholder('Description');
    this.formAmountInput = page.getByPlaceholder('Amount');
    this.formCategorySelect = page.locator('select').first();
    this.formSaveButton = page.getByRole('button', { name: 'Save' });

    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilterSelect = page.locator('select').last();

    this.tableRows = page.locator('tbody tr').filter({ hasNotText: 'No transactions found' });
    this.noResultsRow = page.getByText('No transactions found');

    this.columnHeaderDate = page.getByText('Date', { exact: false }).filter({ has: page.locator('th') }).first();
    this.columnHeaderCategory = page.getByRole('columnheader', { name: /category/i });
    this.columnHeaderAmount = page.getByRole('columnheader', { name: /amount/i });

    this.footerTransactionCount = page.locator('footer').getByText(/transaction/i).first();
    this.footerTotal = page.locator('footer').getByText(/total/i).first();
  }

  async navigate() {
    await this.navButton.click();
  }

  async openAddForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fill and submit the Add Expense form.
   * Call openAddForm() first.
   */
  async addExpense(description: string, amount: string, category?: string) {
    await this.formDescriptionInput.fill(description);
    await this.formAmountInput.fill(amount);
    if (category) {
      await this.formCategorySelect.selectOption(category);
    }
    await this.formSaveButton.click();
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term);
  }

  async filterByCategory(category: string) {
    // The category dropdown is the last <select> on the page (not the form one)
    await this.page
      .locator('select')
      .filter({ hasText: 'All Categories' })
      .selectOption(category);
  }

  async clearSearch() {
    await this.searchInput.clear();
  }
}
