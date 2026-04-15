import { Page, Locator } from '@playwright/test';

export class ExpensesPage {
  readonly addExpenseButton: Locator;
  readonly dateInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;
  readonly transactionRows: Locator;

  constructor(private page: Page) {
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.dateInput = page.locator('input[type="date"]');
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.categorySelect = page.locator('select').filter({ hasText: /food/i }).first();
    this.saveButton = page.getByRole('button', { name: /save/i });
    this.transactionRows = page.locator('tbody tr');
  }

  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  async openAddExpenseForm() {
    await this.addExpenseButton.click();
  }

  async fillExpenseForm(description: string, amount: string, category: string) {
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    await this.page.locator('select').filter({ hasText: /food|housing|transport/i }).first().selectOption(category);
  }

  async saveExpense() {
    await this.saveButton.click();
  }
}
