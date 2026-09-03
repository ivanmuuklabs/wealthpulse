import { Page, Locator } from '@playwright/test';

export class ExpensesPage {
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly addExpenseButton: Locator;
  readonly saveButton: Locator;
  readonly tableRows: Locator;
  readonly footerSummary: Locator;

  // Add-expense form fields
  readonly dateInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;

  constructor(private page: Page) {
    this.searchInput = page.getByPlaceholder(/search/i);
    this.categoryFilter = page.locator('select').filter({ hasText: /all categories/i });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.saveButton = page.getByRole('button', { name: /save/i });
    this.tableRows = page.locator('tbody tr');
    this.footerSummary = page.locator('tfoot tr');

    // Form fields (visible only after clicking Add Expense)
    this.dateInput = page.locator('input[type="date"]');
    this.descriptionInput = page.getByPlaceholder(/description/i);
    this.amountInput = page.locator('input[type="number"]').filter({ hasText: '' }).nth(0);
    this.categorySelect = page.locator('select').filter({ hasText: /food/i });
  }

  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  async openAddExpenseForm() {
    await this.addExpenseButton.click();
  }

  async fillExpenseForm(opts: {
    date?: string;
    description: string;
    amount: string;
    category?: string;
  }) {
    if (opts.date) {
      await this.dateInput.fill(opts.date);
    }
    await this.descriptionInput.fill(opts.description);
    // Amount field: find the spinbutton labelled by its placeholder or aria
    const amountField = this.page.getByRole('spinbutton');
    await amountField.fill(opts.amount);
    if (opts.category) {
      // The category select is the one containing the category options
      await this.page
        .locator('select')
        .filter({ hasText: /food/i })
        .selectOption(opts.category);
    }
  }

  async saveExpense() {
    await this.saveButton.click();
  }
}
