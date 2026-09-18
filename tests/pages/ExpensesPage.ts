import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Expenses tab.
 * Covers the transaction table, search/filter, sorting, and Add Expense form.
 */
export class ExpensesPage {
  readonly heading: Locator;
  readonly expensesNavButton: Locator;
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly transactionTable: Locator;
  readonly emptyState: Locator;

  // Add Expense form fields
  readonly dateInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Expenses' });
    this.expensesNavButton = page.getByRole('button', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: 'Add Expense' });
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').filter({ hasText: /All Categories/ });
    this.transactionTable = page.locator('table');
    this.emptyState = page.getByText('No transactions found');

    // Form fields (only visible when the form is open)
    this.dateInput = page.locator('input[type="date"]');
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    this.categorySelect = page.locator('select').filter({ hasText: /Food/ }).first();
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async navigate() {
    await this.expensesNavButton.click();
  }

  async openAddExpenseForm() {
    await this.addExpenseButton.click();
  }

  async addExpense(description: string, amount: string, category = 'Food') {
    await this.openAddExpenseForm();
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    // Select category in the inline form select
    await this.page.locator('select').last().selectOption(category);
    await this.saveButton.click();
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term);
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  async getTransactionCount(): Promise<number> {
    // Footer shows "X transaction(s)"
    const footer = await this.page.locator('table').locator('..').locator('..').locator('div').filter({ hasText: /transaction/ }).last().textContent();
    const match = footer?.match(/(\d+)\s+transaction/);
    return match ? parseInt(match[1], 10) : 0;
  }
}
