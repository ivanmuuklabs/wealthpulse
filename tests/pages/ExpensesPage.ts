import { Page, Locator } from '@playwright/test';

export class ExpensesPage {
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly addExpenseButton: Locator;
  readonly expenseForm: Locator;
  readonly dateInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;
  readonly transactionRows: Locator;
  readonly footerSummary: Locator;

  constructor(private page: Page) {
    this.searchInput     = page.getByPlaceholder('Search transactions…');
    this.categoryFilter  = page.getByRole('combobox').filter({ hasText: /All Categories/i });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });

    // The form that expands after clicking "Add Expense"
    this.expenseForm     = page.locator('form');
    this.dateInput       = page.getByLabel('Date');
    this.descriptionInput = page.getByLabel('Description');
    this.amountInput     = page.getByLabel('Amount');
    this.categorySelect  = page.getByRole('combobox').filter({ hasText: /Food|Housing|Transport|Entertainment|Health|Utilities|Shopping|Subscriptions/i });
    this.saveButton      = page.getByRole('button', { name: /^Save$/i });

    // Rows in the transactions table (each row has a date, description, category, amount)
    this.transactionRows = page.locator('table tbody tr');

    // Footer row / summary line showing count and total
    this.footerSummary   = page.locator('tfoot tr').first();
  }

  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Fill and submit the New Expense form. */
  async addExpense(description: string, amount: number, category = 'Food', date?: string) {
    await this.addExpenseButton.click();
    if (date) await this.dateInput.fill(date);
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(String(amount));
    // Select category by visible text
    await this.page.getByRole('combobox').filter({ hasText: /Food|Housing|Transport|Entertainment|Health|Utilities|Shopping|Subscriptions/i }).selectOption(category);
    await this.saveButton.click();
  }
}
