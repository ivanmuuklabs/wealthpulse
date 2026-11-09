import { Page, Locator } from '@playwright/test';

export class ExpensesPage {
  readonly addExpenseButton: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  /** Category select inside the "New Expense" form (the filter select has an "All" option). */
  readonly categorySelect: Locator;
  readonly saveButton: Locator;

  constructor(private page: Page) {
    this.addExpenseButton = page.getByRole('button', { name: 'Add Expense' });
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.categorySelect = page
      .locator('select')
      .filter({ hasNot: page.locator('option[value="All"]') });
    this.saveButton = page.getByRole('button', { name: 'Save', exact: true });
  }

  async navigate() {
    await this.page.getByRole('button', { name: 'Expenses', exact: true }).click();
  }

  /** Adds an expense dated the 15th of the currently selected month (form default). */
  async addExpense(category: string, description: string, amount: string) {
    await this.addExpenseButton.click();
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    await this.categorySelect.selectOption(category);
    await this.saveButton.click();
  }
}
