import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the Dashboard (Charts) tab.
 *
 * Covers:
 *   - KPI cards: Total Spent, Monthly Income, Net Savings, Transactions
 *   - Month selector (Jan / Feb / Mar)
 *   - Spending by Category donut chart
 *   - Cumulative Spending area chart
 *   - Monthly Comparison bar chart
 *   - Budget Alerts section
 *   - Recent Transactions section
 */
export class DashboardPage {
  readonly totalSpentCard: Locator;
  readonly monthlyIncomeCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;
  readonly recentTransactionsSection: Locator;
  readonly budgetAlertsSection: Locator;
  readonly spendingByCategoryHeading: Locator;
  readonly cumulativeSpendingHeading: Locator;
  readonly monthlyComparisonHeading: Locator;

  constructor(private page: Page) {
    // KPI stat cards — identified by their label text
    this.totalSpentCard     = page.getByText('Total Spent').locator('..');
    this.monthlyIncomeCard  = page.getByText('Monthly Income').locator('..');
    this.netSavingsCard     = page.getByText('Net Savings').locator('..');
    this.transactionsCard   = page.getByText('Transactions').locator('..');

    // Named sections
    this.recentTransactionsSection  = page.getByText('Recent Transactions').first();
    this.budgetAlertsSection        = page.getByText('Budget Alerts').first();
    this.spendingByCategoryHeading  = page.getByText('Spending by Category');
    this.cumulativeSpendingHeading  = page.getByText('Cumulative Spending');
    this.monthlyComparisonHeading   = page.getByText('Monthly Comparison');
  }

  /** Navigate to the Dashboard (Charts) tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  /**
   * Click one of the month selector buttons.
   * @param month  Abbreviated month name shown in the tab: 'Jan' | 'Feb' | 'Mar'
   */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /**
   * Read the primary dollar-amount value displayed inside a KPI card.
   * Returns the raw text including the $ sign, e.g. "$2,341.50".
   */
  async getKpiText(card: Locator): Promise<string> {
    const text = await card
      .locator('p.text-xl')
      .first()
      .textContent();
    return text?.trim() ?? '';
  }
}
