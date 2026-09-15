import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — page object for the Charts / Overview tab.
 *
 * Covers:
 *  - Month selector buttons (Jan / Feb / Mar)
 *  - KPI StatCards (Monthly Income, Total Spent, Net Savings, Transactions)
 *  - Budget Alerts section
 *  - Recent Transactions list
 */
export class DashboardPage {
  // Month selector buttons
  readonly monthButtons: Locator;

  // KPI card labels
  readonly totalSpentLabel: Locator;
  readonly monthlyIncomeLabel: Locator;
  readonly netSavingsLabel: Locator;
  readonly transactionsLabel: Locator;

  // Budget alerts section
  readonly budgetAlertsHeading: Locator;

  // Recent transactions section
  readonly recentTransactionsHeading: Locator;
  readonly recentTransactionRows: Locator;

  constructor(private page: Page) {
    this.monthButtons = page.locator('div').filter({ has: page.getByRole('button', { name: 'Jan' }) }).getByRole('button');

    this.totalSpentLabel     = page.getByText('Total Spent').first();
    this.monthlyIncomeLabel  = page.getByText('Monthly Income').first();
    this.netSavingsLabel     = page.getByText('Net Savings').first();
    this.transactionsLabel   = page.getByText('Transactions').first();

    this.budgetAlertsHeading        = page.getByText('Budget Alerts');
    this.recentTransactionsHeading  = page.getByText('Recent Transactions');
    this.recentTransactionRows      = page.locator('div').filter({ hasText: /^Recent Transactions/ }).locator('..').locator('div[class*="flex items-center gap-3 py-2"]');
  }

  /** Navigate to the Charts (dashboard) section via the sidebar button. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
    await this.page.getByRole('heading', { name: 'Overview' }).waitFor({ state: 'visible' });
  }

  /** Click one of the three month selector buttons. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month, exact: true }).first().click();
  }

  /**
   * Read the displayed value beneath a given KPI label.
   * The StatCard renders: <label> → <p class="text-xl"> (value).
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
