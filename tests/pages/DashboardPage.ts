import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — page object for the Charts/Overview tab.
 *
 * The Dashboard is the default tab after login. It shows:
 *  - A month-selector (Jan / Feb / Mar)
 *  - Four KPI StatCards: Total Spent, Monthly Income, Net Savings, Transactions
 *  - A "Budget Alerts" section (categories that are >50% of budget)
 *  - A "Recent Transactions" list (top 8 transactions for the month)
 */
export class DashboardPage {
  /** Month selector buttons in the Overview tab */
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  /** KPI stat card labels */
  readonly totalSpentLabel: Locator;
  readonly monthlyIncomeLabel: Locator;
  readonly netSavingsLabel: Locator;
  readonly transactionsLabel: Locator;

  /** Budget Alerts section heading */
  readonly budgetAlertsHeading: Locator;

  /** Recent Transactions section heading */
  readonly recentTransactionsHeading: Locator;

  /** Overview page heading */
  readonly overviewHeading: Locator;

  constructor(private page: Page) {
    // Month buttons inside the Overview month-selector container
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    // KPI labels
    this.totalSpentLabel     = page.getByText('Total Spent');
    this.monthlyIncomeLabel  = page.getByText('Monthly Income');
    this.netSavingsLabel     = page.getByText('Net Savings');
    this.transactionsLabel   = page.getByText('Transactions');

    // Section headings
    this.budgetAlertsHeading        = page.getByRole('heading', { name: 'Budget Alerts' }).or(page.getByText('Budget Alerts'));
    this.recentTransactionsHeading  = page.getByText('Recent Transactions');
    this.overviewHeading            = page.getByRole('heading', { name: 'Overview' });
  }

  /** Navigate to the Dashboard by clicking the Charts sidebar button. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  /**
   * Switch to the given month (0 = Jan, 1 = Feb, 2 = Mar) using the
   * Overview month-selector.
   */
  async selectMonth(monthIndex: 0 | 1 | 2) {
    const buttons = [this.janButton, this.febButton, this.marButton];
    await buttons[monthIndex].click();
  }

  /**
   * Read the displayed value from a KPI card by its label text.
   * Returns the trimmed text of the sibling <p> that contains the dollar amount.
   */
  async getKpiValue(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?|\d+/)
      .first()
      .textContent();
  }

  /** Return all visible transaction description texts in the Recent Transactions list. */
  async getRecentTransactionDescriptions(): Promise<string[]> {
    return this.page
      .getByText('Recent Transactions')
      .locator('../..')
      .locator('p.text-sm.text-white')
      .allTextContents();
  }
}
