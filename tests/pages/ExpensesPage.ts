import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Expenses tab.
 *
 * Covers: transaction list, search/filter, sort controls, and the
 * "Add Expense" inline form.
 */
export class ExpensesPage {
  // Navigation
  readonly navButton: Locator;

  // Toolbar
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;

  // Add-expense form
  readonly formPanel: Locator;
  readonly dateInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;

  // Table
  readonly tableRows: Locator;
  readonly emptyState: Locator;
  readonly footerCount: Locator;
  readonly footerTotal: Locator;

  // Sort headers
  readonly sortDate: Locator;
  readonly sortAmount: Locator;
  readonly sortCategory: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /expenses/i });

    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').filter({ hasText: /all categories/i }).first();

    this.formPanel = page.getByText('New Expense');
    this.dateInput = page.locator('input[type="date"]');
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.categorySelect = page.locator('select').filter({ hasText: /food|housing/i }).first();
    this.saveButton = page.getByRole('button', { name: 'Save' });

    this.tableRows = page.locator('tbody tr');
    this.emptyState = page.locator('td', { hasText: 'No transactions found' });
    this.footerCount = page.locator('div').filter({ hasText: /^\d+ transactions?$/ }).last();
    this.footerTotal = page.locator('div').filter({ hasText: /Total:/ }).last();

    this.sortDate = page.getByRole('columnheader', { name: /date/i });
    this.sortAmount = page.getByRole('columnheader', { name: /amount/i });
    this.sortCategory = page.getByRole('columnheader', { name: /category/i });
  }

  async navigate() {
    await this.navButton.click();
  }

  async openAddForm() {
    await this.addExpenseButton.click();
  }

  async addExpense(description: string, amount: string, category: string, date?: string) {
    await this.openAddForm();
    if (date) {
      await this.dateInput.fill(date);
    }
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    // Select the category in the form's select (not the filter select)
    await this.page
      .locator('form, .grid')
      .filter({ has: this.descriptionInput })
      .locator('select')
      .selectOption(category)
      .catch(async () => {
        // Fallback: find the select inside the card that contains the Save button
        await this.page
          .locator('select')
          .filter({ hasText: category })
          .first()
          .selectOption(category);
      });
    await this.saveButton.click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }
}
