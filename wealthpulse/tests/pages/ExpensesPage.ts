import { Page, Locator } from '@playwright/test';

export class ExpensesPage {
  readonly addExpenseButton: Locator;
  readonly dateInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;
  readonly tableRows: Locator;
  readonly summaryFooter: Locator;

  constructor(private page: Page) {
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.dateInput = page.locator('input[type="date"]');
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.categorySelect = page.locator('select').filter({ hasText: /food|housing|transport/i });
    this.saveButton = page.getByRole('button', { name: /save/i });
    // Each data row in the expenses table (excludes header)
    this.tableRows = page.locator('tbody tr');
    // Footer row showing total count and amount
    this.summaryFooter = page.locator('tfoot tr, [data-testid="expenses-summary"]').first();
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
    await this.categorySelect.selectOption(category);
  }

  async submitExpenseForm() {
    await this.saveButton.click();
  }
}
