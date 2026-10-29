import { Page, Locator } from '@playwright/test';

/**
 * ExpensesPage — encapsulates all selectors and actions for the Expenses tab.
 *
 * The Expenses tab lets the user:
 *  - Switch months (Jan / Feb / Mar)
 *  - Search transactions by description, category, or date
 *  - Filter by category via a <select>
 *  - Sort the table by Date, Category, or Amount
 *  - Add a new expense via the inline form
 */
export class ExpensesPage {
  // ── Navigation ──────────────────────────────────────────
  readonly navButton: Locator;

  // ── Month selector ───────────────────────────────────────
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // ── Toolbar ──────────────────────────────────────────────
  readonly addExpenseButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;

  // ── Add-expense form ─────────────────────────────────────
  readonly formDateInput: Locator;
  readonly formDescInput: Locator;
  readonly formAmountInput: Locator;
  readonly formCategorySelect: Locator;
  readonly formSaveButton: Locator;

  // ── Table ────────────────────────────────────────────────
  readonly tableRows: Locator;
  readonly emptyStateRow: Locator;
  readonly tableDateHeader: Locator;
  readonly tableCategoryHeader: Locator;
  readonly tableAmountHeader: Locator;
  readonly totalLabel: Locator;
  readonly transactionCountLabel: Locator;

  constructor(private page: Page) {
    // Navigation
    this.navButton = page.getByRole('button', { name: /expenses/i });

    // Month buttons
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    // Toolbar
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i });
    this.searchInput = page.getByPlaceholder('Search transactions…');
    this.categoryFilter = page.locator('select').filter({ hasText: /all categories/i });

    // Form — unique placeholders / labels
    this.formDateInput = page.locator('input[type="date"]');
    this.formDescInput = page.getByPlaceholder('Description');
    this.formAmountInput = page.getByPlaceholder('Amount');
    this.formCategorySelect = page.locator('select').last();
    this.formSaveButton = page.getByRole('button', { name: /^save$/i });

    // Table
    this.tableRows = page.locator('tbody tr').filter({ hasNot: page.locator('td[colspan]') });
    this.emptyStateRow = page.getByText('No transactions found');
    this.tableDateHeader = page.locator('th', { hasText: /^date/i });
    this.tableCategoryHeader = page.locator('th', { hasText: /^category/i });
    this.tableAmountHeader = page.locator('th', { hasText: /^amount/i });
    this.totalLabel = page.locator('text=/Total:/');
    this.transactionCountLabel = page.locator('text=/transaction/i').last();
  }

  /** Navigate to the Expenses tab. */
  async navigate() {
    await this.navButton.click();
  }

  /** Select a month in the tab bar. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    const btn = month === 'Jan' ? this.janButton : month === 'Feb' ? this.febButton : this.marButton;
    await btn.click();
  }

  /** Open the Add-Expense form if it is not already open. */
  async openAddForm() {
    await this.addExpenseButton.click();
  }

  /**
   * Fill and submit the add-expense form.
   * Assumes the form is already open.
   */
  async addExpense(desc: string, amount: string, category: string = 'Food') {
    await this.formDescInput.fill(desc);
    await this.formAmountInput.fill(amount);
    await this.formCategorySelect.selectOption(category);
    await this.formSaveButton.click();
  }

  /** Type into the search input. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Select a category in the filter dropdown. */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }

  /** Click a sortable column header to sort the table. */
  async sortBy(column: 'date' | 'category' | 'amount') {
    if (column === 'date') await this.tableDateHeader.click();
    else if (column === 'category') await this.tableCategoryHeader.click();
    else await this.tableAmountHeader.click();
  }
}
