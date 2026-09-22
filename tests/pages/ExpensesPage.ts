import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 *
 * Encapsulates locators and interactions for:
 *   - Search / category filter
 *   - Add Expense button and the inline form
 *   - Transaction table (rows, count footer, total footer)
 *   - Column sort headers
 */
export class ExpensesPage {
  readonly heading: Locator;
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categorySelect: Locator;
  readonly transactionRows: Locator;
  readonly noResultsRow: Locator;
  readonly footerCount: Locator;

  // Add-expense form fields
  readonly formDescription: Locator;
  readonly formAmount: Locator;
  readonly formCategory: Locator;
  readonly formSaveButton: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    // The search input inside the Expenses filter row (placeholder differs from Investments)
    this.searchInput = page.getByPlaceholder('Search transactions…');

    // Category filter select — the one next to the search box (All Categories default)
    this.categorySelect = page.locator('select').filter({ hasText: 'All Categories' });

    // Table body rows — each rendered transaction
    this.transactionRows = page.locator('tbody tr').filter({ hasNotText: 'No transactions found' });
    this.noResultsRow = page.getByText('No transactions found');

    this.footerCount = page.locator('span').filter({ hasText: /transaction/ });

    // Add-expense form fields (visible only when the form is open)
    this.formDescription = page.getByPlaceholder('Description');
    this.formAmount = page.getByPlaceholder('Amount');
    this.formCategory = page.locator('select').nth(1); // second select (first is category filter)
    this.formSaveButton = page.getByRole('button', { name: 'Save' });
  }

  /** Navigate to the Expenses tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Open the Add Expense form. */
  async openAddForm() {
    await this.addExpenseButton.click();
    await this.formDescription.waitFor({ state: 'visible' });
  }

  /** Fill and submit the Add Expense form. */
  async addExpense(description: string, amount: string, category: string) {
    await this.formDescription.fill(description);
    await this.formAmount.fill(amount);
    // Select the category in the form's select (second select on page)
    await this.page.locator('form, .grid').filter({ hasText: 'New Expense' })
      .getByRole('combobox')
      .selectOption(category);
    await this.formSaveButton.click();
  }

  /** Type in the search box. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category from the category filter dropdown. */
  async filterByCategory(category: string) {
    await this.categorySelect.selectOption(category);
  }

  /** Click a sort-able column header by its visible text. */
  async sortBy(column: 'Date' | 'Category' | 'Amount') {
    await this.page.getByRole('columnheader', { name: new RegExp(column, 'i') }).click();
  }
}
