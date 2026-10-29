import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — encapsulates selectors and actions for the Charts/Dashboard tab.
 *
 * The Dashboard tab provides:
 *  - Month selector (Jan / Feb / Mar)
 *  - Four KPI cards: Total Spent, Monthly Income, Net Savings, Transactions
 *  - Three charts: Spending by Category (donut), Cumulative Spending (area), Monthly Comparison (bar)
 *  - Budget Alerts section (conditional — shows when spending > 50% of a budget)
 *  - Recent Transactions list (latest transactions for the selected month)
 */
export class DashboardPage {
  // ── Navigation ───────────────────────────────────────────
  readonly navButton: Locator;

  // ── Month selector ───────────────────────────────────────
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // ── KPI cards ────────────────────────────────────────────
  /** "Total Spent" KPI label */
  readonly totalSpentLabel: Locator;
  /** "Monthly Income" KPI label */
  readonly monthlyIncomeLabel: Locator;
  /** "Net Savings" KPI label */
  readonly netSavingsLabel: Locator;
  /** "Transactions" KPI label */
  readonly transactionsLabel: Locator;

  // ── Chart headings ───────────────────────────────────────
  readonly spendingByCategoryHeading: Locator;
  readonly cumulativeSpendingHeading: Locator;
  readonly monthlyComparisonHeading: Locator;

  // ── Budget alerts ────────────────────────────────────────
  readonly budgetAlertsHeading: Locator;

  // ── Recent transactions ──────────────────────────────────
  readonly recentTransactionsHeading: Locator;
  readonly recentTransactionRows: Locator;

  // ── Page heading ─────────────────────────────────────────
  readonly overviewHeading: Locator;

  constructor(private page: Page) {
    // Sidebar navigation — the tab is labelled "Charts" in the sidebar
    this.navButton = page.getByRole('button', { name: /^charts$/i });

    // Month buttons — shared across Dashboard and Budgets tabs
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    // KPI card labels (StatCard renders the label as a small uppercase <p>)
    this.totalSpentLabel  = page.getByText('Total Spent',    { exact: true });
    this.monthlyIncomeLabel = page.getByText('Monthly Income', { exact: true });
    this.netSavingsLabel  = page.getByText('Net Savings',    { exact: true });
    this.transactionsLabel = page.getByText('Transactions',  { exact: true });

    // Chart section headings
    this.spendingByCategoryHeading  = page.getByText('Spending by Category');
    this.cumulativeSpendingHeading  = page.getByText('Cumulative Spending');
    this.monthlyComparisonHeading   = page.getByText('Monthly Comparison');

    // Budget alerts (only present when at least one category exceeds 50% of its budget)
    this.budgetAlertsHeading = page.getByText('Budget Alerts');

    // Recent transactions
    this.recentTransactionsHeading = page.getByText('Recent Transactions');
    // Rows inside the recent-transactions table (exclude any colspan "no data" rows)
    this.recentTransactionRows = page.locator('text=/Recent Transactions/')
      .locator('..').locator('table tbody tr').filter({ hasNot: page.locator('td[colspan]') });

    // Page heading
    this.overviewHeading = page.getByRole('heading', { name: /overview/i });
  }

  /** Navigate to the Charts/Dashboard tab via the sidebar. */
  async navigate() {
    await this.navButton.click();
  }

  /** Click the Jan, Feb, or Mar month button. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    const btn = month === 'Jan' ? this.janButton : month === 'Feb' ? this.febButton : this.marButton;
    await btn.click();
  }

  /**
   * Read the text value displayed beneath a KPI label.
   * Finds the card whose label matches, then returns the sibling value <p>.
   */
  async getKpiValue(label: 'Total Spent' | 'Monthly Income' | 'Net Savings' | 'Transactions'): Promise<string> {
    // The StatCard renders: <p class="text-[11px]…">LABEL</p> followed by <p class="text-xl font-bold…">VALUE</p>
    const card = this.page.locator('div', { has: this.page.getByText(label, { exact: true }) }).first();
    const valueEl = card.locator('p.text-xl');
    return (await valueEl.textContent()) ?? '';
  }
}
