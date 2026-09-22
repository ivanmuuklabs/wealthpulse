import { Page, Locator } from '@playwright/test';

export class ExpensesPage {
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly addExpenseButton: Locator;
  readonly saveButton: Locator;
  readonly dateInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly tableRows: Locator;
  readonly footerSummary: Locator;
  readonly monthSelector: { jan: Locator; feb: Locator; mar: Locator };

  constructor(private page: Page) {
    this.searchInput      = page.getByPlaceholder('Search transactions…');
    this.categoryFilter   = page.locator('select').filter({ hasText: /All Categories/ });
    this.addExpenseButton = page.getByRole('button', { name: 'Add Expense' });
    this.saveButton       = page.getByRole('button', { name: 'Save' });
    this.dateInput        = page.locator('input[type="date"]');
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput      = page.locator('input[type="number"]').first();
    this.categorySelect   = page.locator('select').filter({ hasText: /Food|Housing/ });
    // Each data row (excludes header)
    this.tableRows        = page.locator('tbody tr');
    this.footerSummary    = page.locator('tfoot tr');
    this.monthSelector    = {
      jan: page.getByRole('button', { name: 'Jan' }),
      feb: page.getByRole('button', { name: 'Feb' }),
      mar: page.getByRole('button', { name: 'Mar' }),
    };
  }

  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.monthSelector[month.toLowerCase() as 'jan' | 'feb' | 'mar'].click();
  }

  async openAddExpenseForm() {
    await this.addExpenseButton.click();
  }

  async fillNewExpense(opts: {
    description: string;
    amount: string;
    category?: string;
  }) {
    await this.descriptionInput.fill(opts.description);
    await this.amountInput.fill(opts.amount);
    if (opts.category) {
      await this.categorySelect.selectOption(opts.category);
    }
  }

  async submitExpense() {
    await this.saveButton.click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  async sortBy(column: 'Date' | 'Category' | 'Amount') {
    await this.page.getByRole('columnheader', { name: column }).click();
  }
}
