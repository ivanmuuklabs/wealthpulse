import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — page object for the Charts (Dashboard) tab.
 *
 * Covers:
 *  - Month selector buttons (Jan / Feb / Mar)
 *  - KPI stat cards
 *  - Budget Alerts section
 *  - Recent Transactions list
 */
export class DashboardPage {
  readonly overviewHeading: Locator;
  readonly monthlyIncomeCard: Locator;
  readonly totalSpentCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;
  readonly budgetAlertsSection: Locator;
  readonly recentTransactionsList: Locator;

  constructor(private page: Page) {
    this.overviewHeading = page.getByRole('heading', { name: 'Overview' });
    // KPI cards are identified by their label text
    this.monthlyIncomeCard = page.getByText('Monthly Income');
    this.totalSpentCard = page.getByText('Total Spent').first();
    this.netSavingsCard = page.getByText('Net Savings');
    this.transactionsCard = page.getByText('Transactions').first();
    // Budget Alerts card heading
    this.budgetAlertsSection = page.getByText('Budget Alerts');
    // Recent Transactions heading
    this.recentTransactionsList = page.getByText('Recent Transactions');
  }

  /** Navigate to the Charts/Dashboard tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
    await this.overviewHeading.waitFor({ state: 'visible' });
  }

  /** Click a month tab by its short name (Jan, Feb, Mar). */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).first().click();
  }

  /**
   * Returns the text content of the value element directly inside the KPI card
   * that contains the given label text.
   */
  async getKpiValue(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .locator('p.text-xl')
      .first()
      .textContent();
  }
}
