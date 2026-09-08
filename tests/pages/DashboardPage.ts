import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Charts/Dashboard (Overview) tab.
 * Encapsulates selectors and interactions for KPI cards,
 * month switcher, budget alerts, and recent transactions.
 */
export class DashboardPage {
  readonly heading: Locator;
  readonly monthlyIncomeCard: Locator;
  readonly totalSpentCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;
  readonly budgetAlertsSection: Locator;
  readonly recentTransactionsSection: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Overview' });
    this.monthlyIncomeCard = page.getByText('Monthly Income');
    this.totalSpentCard = page.getByText('Total Spent').first();
    this.netSavingsCard = page.getByText('Net Savings');
    this.transactionsCard = page.getByText('Transactions');
    this.budgetAlertsSection = page.getByText('Budget Alerts');
    this.recentTransactionsSection = page.getByText('Recent Transactions');
  }

  /** Navigate to the Charts/Dashboard tab from within the app. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  /** Click a month button by its short name (Jan, Feb, Mar). */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /**
   * Read the dollar value displayed inside a KPI card identified by its label.
   * Returns the raw text content of the first dollar-formatted value found.
   */
  async getKpiValue(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();
  }
}
