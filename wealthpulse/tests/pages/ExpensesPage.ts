import { Page, Locator } from '@playwright/test';

export class ExpensesPage {
  readonly addExpenseButton: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly dateInput: Locator;
  readonly saveButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;

  constructor(private page: Page) {
    this.addExpenseButton = page.getByRole('button', { name: 'Add Expense' });
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.categorySelect = page.locator('form select');
    this.dateInput = page.locator('input[type="date"]');
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').first();
  }

  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  async clickAddExpense() {
    await this.addExpenseButton.click();
  }

  async fillForm({
    date,
    description,
    amount,
    category,
  }: {
    date?: string;
    description?: string;
    amount?: number;
    category?: string;
  }) {
    if (date) await this.dateInput.fill(date);
    if (description) await this.descriptionInput.fill(description);
    if (amount !== undefined) await this.amountInput.fill(String(amount));
    if (category) await this.categorySelect.selectOption(category);
  }

  async save() {
    await this.saveButton.click();
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  async search(text: string) {
    await this.searchInput.fill(text);
  }

  async clickMonthTab(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }
}
