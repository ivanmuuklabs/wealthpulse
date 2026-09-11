import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — page object for the Expenses tab.
 *
 * Covers:
 *  - Navigation
 *  - Month selector
 *  - Add Expense form (toggle, fill, submit)
 *  - Search input
 *  - Category filter dropdown
 *  - Transaction table rows
 *  - Footer (count + total)
 */
export class ExpensesPage {
  readonly heading: Locator;
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categorySelect: Locator;
  readonly tableRows: Locator;
  readonly emptyState: Locator;
  readonly footerCount: Locator;

  // Add-expense form fields (only visible when form is open)
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categoryFormSelect: Locator;
  readonly saveButton: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput = page.getByPlaceholder('Search transactions…');
    // The category filter select sits outside the form
    this.categorySelect = page.locator('select').filter({ hasText: 'All Categories' });
    this.tableRows = page.locator('tbody tr').filter({ hasNot: page.getByText('No transactions found') });
    this.emptyState = page.getByText('No transactions found');
    this.footerCount = page.locator('div.px-5.py-3.border-t span').first();

    // Form inputs — only present after clicking "Add Expense"
    this.descriptionInput = page.getByPlaceholder('Description');
    this.amountInput = page.getByPlaceholder('Amount');
    // The in-form category select is inside the card with "New Expense"
    this.categoryFormSelect = page
      .locator('div', { hasText: /^New Expense/ })
      .locator('select')
      .first();
    this.saveButton = page.getByRole('button', { name: 'Save' });
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
      await this.categoryFormSelect.selectOption(category);
    }
    await this.saveButton.click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  async filterByCategory(category: string) {
    await this.categorySelect.selectOption(category === 'All' ? 'All Categories' : category);
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }
}
