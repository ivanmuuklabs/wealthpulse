import { Page, Locator } from '@playwright/test';

export class ExpensesPage {
  // ── Navigation ───────────────────────────────────────────────────────────
  readonly heading: Locator;

  // ── Toolbar ──────────────────────────────────────────────────────────────
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categoryDropdown: Locator;

  // ── Add-expense form (visible after clicking "Add Expense") ──────────────
  readonly formDateInput: Locator;
  readonly formDescriptionInput: Locator;
  readonly formAmountInput: Locator;
  readonly formCategorySelect: Locator;
  readonly formSaveButton: Locator;

  // ── Table ─────────────────────────────────────────────────────────────────
  readonly tableRows: Locator;       // <tr> data rows (excludes header)
  readonly tableSummary: Locator;    // "22 transactions · Total: $X,XXX.XX" footer bar

  constructor(private page: Page) {
    this.heading         = page.getByRole('heading', { name: 'Expenses' });
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput     = page.getByPlaceholder('Search transactions…');
    this.categoryDropdown = page.locator('select').filter({ hasText: /all categories/i });

    this.formDateInput        = page.locator('input[type="date"]');
    this.formDescriptionInput = page.getByPlaceholder('Description');
    this.formAmountInput      = page.getByPlaceholder('Amount');
    this.formCategorySelect   = page.locator('form, .border-emerald-500\\/20').locator('select').last();
    this.formSaveButton       = page.getByRole('button', { name: /^save$/i });

    // Rows inside the expenses <tbody> — each visible data row
    this.tableRows   = page.locator('tbody tr');
    this.tableSummary = page.locator('.border-t.border-white\\/\\[0\\.06\\]').last();
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async navigate() {
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  async openAddExpenseForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fills and submits the Add Expense form.
   * @param description  Transaction description text
   * @param amount       Numeric amount (e.g. 42.5)
   * @param category     One of the 8 expense categories
   * @param date         Optional ISO date string (YYYY-MM-DD); defaults to form pre-fill
   */
  async addExpense(
    description: string,
    amount: number,
    category: string,
    date?: string,
  ) {
    await this.openAddExpenseForm();
    if (date) await this.formDateInput.fill(date);
    await this.formDescriptionInput.fill(description);
    await this.formAmountInput.fill(String(amount));
    await this.formCategorySelect.selectOption(category);
    await this.formSaveButton.click();
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term);
  }

  async filterByCategory(category: string) {
    await this.categoryDropdown.selectOption(category);
  }

  async clearSearch() {
    await this.searchInput.clear();
  }

  async clearCategoryFilter() {
    await this.categoryDropdown.selectOption('All');
  }
}
