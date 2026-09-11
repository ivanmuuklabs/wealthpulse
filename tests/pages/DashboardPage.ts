import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — page object for the Dashboard (Charts) section.
 *
 * Encapsulates locators and helpers for:
 *  - Month selector buttons (Jan / Feb / Mar)
 *  - KPI stat cards (Total Spent, Monthly Income, Net Savings, Transactions)
 *  - Chart section headings
 *  - Budget Alerts panel
 *  - Recent Transactions list
 */
export class DashboardPage {
  readonly overviewHeading: Locator;
  readonly monthJan: Locator;
  readonly monthFeb: Locator;
  readonly monthMar: Locator;

  // KPI cards — located by label text, then sibling value
  readonly totalSpentLabel: Locator;
  readonly monthlyIncomeLabel: Locator;
  readonly netSavingsLabel: Locator;
  readonly transactionsLabel: Locator;

  // Chart headings
  readonly spendingByCategoryHeading: Locator;
  readonly cumulativeSpendingHeading: Locator;
  readonly monthlyComparisonHeading: Locator;

  // Budget alerts
  readonly budgetAlertsHeading: Locator;

  // Recent transactions
  readonly recentTransactionsHeading: Locator;
  readonly recentTransactionRows: Locator;

  constructor(private page: Page) {
    this.overviewHeading = page.getByRole('heading', { name: 'Overview' });

    this.monthJan = page.getByRole('button', { name: 'Jan' });
    this.monthFeb = page.getByRole('button', { name: 'Feb' });
    this.monthMar = page.getByRole('button', { name: 'Mar' });

    this.totalSpentLabel = page.getByText('Total Spent');
    this.monthlyIncomeLabel = page.getByText('Monthly Income');
    this.netSavingsLabel = page.getByText('Net Savings');
    this.transactionsLabel = page.getByText('Transactions');

    this.spendingByCategoryHeading = page.getByText('Spending by Category');
    this.cumulativeSpendingHeading = page.getByText('Cumulative Spending');
    this.monthlyComparisonHeading = page.getByText('Monthly Comparison');

    this.budgetAlertsHeading = page.getByText('Budget Alerts');
    this.recentTransactionsHeading = page.getByText('Recent Transactions');

    // Each recent-transaction row has a negative amount in red
    this.recentTransactionRows = page
      .locator('div.space-y-1 > div')
      .filter({ has: page.locator('span.text-red-400') });
  }

  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  /** Read the displayed text of a KPI stat card by its label. */
  async getKpiValue(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?|\d+/)
      .first()
      .textContent();
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    const btn = this.page.getByRole('button', { name: month });
    await btn.click();
  }
}
