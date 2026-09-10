import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — page object for the Overview (Charts) section.
 *
 * Exposes locators and helpers for the month selector, KPI stat cards,
 * chart panels, budget alerts, and the recent transactions list.
 */
export class DashboardPage {
  // Month selector buttons
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // KPI stat card labels
  readonly totalSpentCard: Locator;
  readonly monthlyIncomeCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;

  // Main heading that confirms we are on the Overview page
  readonly overviewHeading: Locator;

  // Chart section headings
  readonly spendingByCategoryHeading: Locator;
  readonly cumulativeSpendingHeading: Locator;
  readonly monthlyComparisonHeading: Locator;

  // Budget alerts section
  readonly budgetAlertsHeading: Locator;

  // Recent transactions section
  readonly recentTransactionsHeading: Locator;

  constructor(private page: Page) {
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    this.totalSpentCard      = page.getByText('Total Spent');
    this.monthlyIncomeCard   = page.getByText('Monthly Income');
    this.netSavingsCard      = page.getByText('Net Savings');
    this.transactionsCard    = page.getByText('Transactions');

    this.overviewHeading             = page.getByRole('heading', { name: 'Overview' });
    this.spendingByCategoryHeading   = page.getByText('Spending by Category');
    this.cumulativeSpendingHeading   = page.getByText('Cumulative Spending');
    this.monthlyComparisonHeading    = page.getByText('Monthly Comparison');
    this.budgetAlertsHeading         = page.getByText('Budget Alerts');
    this.recentTransactionsHeading   = page.getByText('Recent Transactions');
  }

  /** Navigate to the Charts (dashboard) section via the sidebar button. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  /** Switch month by clicking the short-name button (Jan / Feb / Mar). */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /**
   * Read the dollar-value from any KPI stat card by its label text.
   * Returns the text content of the first currency-formatted sibling found.
   */
  async getKpiValue(label: string): Promise<string> {
    const value = await this.page
      .getByText(label)
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();
    return value ?? '';
  }
}
