import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Dashboard (Charts) tab.
 * Covers the month selector, KPI stat cards, budget alerts section,
 * and the recent-transactions list.
 */
export class DashboardPage {
  /** Month selector buttons (Jan / Feb / Mar) */
  readonly monthButtons: Locator;

  /** KPI stat-card labels */
  readonly totalSpentLabel: Locator;
  readonly monthlyIncomeLabel: Locator;
  readonly netSavingsLabel: Locator;
  readonly transactionsLabel: Locator;

  /** "Budget Alerts" section heading — only rendered when at least one category
   *  has exceeded 50 % of its limit */
  readonly budgetAlertsHeading: Locator;

  /** "Recent Transactions" section heading */
  readonly recentTransactionsHeading: Locator;

  /** Individual transaction rows inside the Recent Transactions card */
  readonly recentTransactionRows: Locator;

  /** The Overview page heading */
  readonly overviewHeading: Locator;

  constructor(private page: Page) {
    this.monthButtons = page.locator('button', { hasText: /^(Jan|Feb|Mar)$/ });
    this.totalSpentLabel = page.getByText('Total Spent');
    this.monthlyIncomeLabel = page.getByText('Monthly Income');
    this.netSavingsLabel = page.getByText('Net Savings');
    this.transactionsLabel = page.getByText('Transactions');
    this.budgetAlertsHeading = page.getByText('Budget Alerts');
    this.recentTransactionsHeading = page.getByText('Recent Transactions');
    this.recentTransactionRows = page
      .getByText('Recent Transactions')
      .locator('..')
      .locator('div.flex.items-center.gap-3');
    this.overviewHeading = page.getByRole('heading', { name: 'Overview' });
  }

  /** Navigate to the Charts / Dashboard tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
    await this.overviewHeading.waitFor({ state: 'visible' });
  }

  /** Click a specific month button by short name (e.g. 'Jan', 'Feb', 'Mar'). */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /**
   * Read the text of the value line directly beneath a KPI label.
   * The StatCard renders:  <p>label</p>  <p>value</p>  inside a parent div.
   */
  async getKpiValue(label: string): Promise<string> {
    return (
      (await this.page
        .getByText(label)
        .locator('..')
        .locator('p.text-xl')
        .first()
        .textContent()) ?? ''
    );
  }
}
