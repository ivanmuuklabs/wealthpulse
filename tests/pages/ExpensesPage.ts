import { Page, Locator } from '@playwright/test';

export class ExpensesPage {
  readonly heading: Locator;
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly newExpenseForm: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly saveButton: Locator;
  readonly tableBody: Locator;
  readonly noResultsRow: Locator;
  readonly footerTransactionCount: Locator;
  readonly footerTotal: Locator;
  readonly dateHeader: Locator;
  readonly categoryHeader: Locator;
  readonly amountHeader: Locator;

  constructor(private page: Page) {
    this.heading           = page.getByRole('heading', { name: 'Expenses' }).or(
                               page.locator('h2', { hasText: 'Expenses' })
                             );
    this.addExpenseButton  = page.getByRole('button', { name: 'Add Expense' });
    this.searchInput       = page.getByPlaceholder('Search transactions…');
    this.categoryFilter    = page.locator('select').filter({ hasText: 'All Categories' });
    this.newExpenseForm    = page.getByText('New Expense');
    this.descriptionInput  = page.getByPlaceholder('Description');
    this.amountInput       = page.getByPlaceholder('Amount');
    this.saveButton        = page.getByRole('button', { name: 'Save' });
    this.tableBody         = page.locator('table tbody');
    this.noResultsRow      = page.getByText('No transactions found');
    this.footerTransactionCount = page.locator('div').filter({ hasText: /^\d+ transactions?$/ }).last();
    this.footerTotal       = page.locator('div').filter({ hasText: /^Total:/ }).last();
    this.dateHeader        = page.locator('th', { hasText: /^Date/ });
    this.categoryHeader    = page.locator('th', { hasText: /^Category/ });
    this.amountHeader      = page.locator('th', { hasText: /^Amount/ });
  }

  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  async openAddExpenseForm() {
    await this.addExpenseButton.click();
  }

  async fillAndSaveExpense(description: string, amount: string, category?: string) {
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    if (category) {
      await this.page
        .locator('select')
        .filter({ hasText: /Housing|Food|Transport/ })
        .last()
        .selectOption(category);
    }
    await this.saveButton.click();
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term);
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  async sortBy(column: 'date' | 'category' | 'amount') {
    const header = { date: this.dateHeader, category: this.categoryHeader, amount: this.amountHeader }[column];
    await header.click();
  }

  /** Returns all visible row amounts as raw text strings from the Amount column. */
  async getRowAmounts(): Promise<string[]> {
    const cells = this.page.locator('table tbody tr td:last-child');
    return cells.allTextContents();
  }
}
