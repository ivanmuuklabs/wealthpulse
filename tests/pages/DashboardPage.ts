import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — page object for the Charts/Overview tab.
 *
 * The dashboard is the default tab after login. It contains:
 *   - A month selector (Jan | Feb | Mar)
 *   - KPI stat cards (Total Spent, Monthly Income, Net Savings, Transactions)
 *   - Budget alerts section
 *   - Recent Transactions list
 */
export class DashboardPage {
  // Month-selector buttons
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // KPI stat card labels
  readonly totalSpentLabel: Locator;
  readonly monthlyIncomeLabel: Locator;
  readonly netSavingsLabel: Locator;
  readonly transactionsLabel: Locator;

  // Budget alerts section heading
  readonly budgetAlertsHeading: Locator;

  // Recent transactions section heading
  readonly recentTransactionsHeading: Locator;

  constructor(private page: Page) {
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    this.totalSpentLabel     = page.getByText('Total Spent').first();
    this.monthlyIncomeLabel  = page.getByText('Monthly Income').first();
    this.netSavingsLabel     = page.getByText('Net Savings').first();
    this.transactionsLabel   = page.getByText('Transactions').first();

    this.budgetAlertsHeading       = page.getByText('Budget Alerts');
    this.recentTransactionsHeading = page.getByText('Recent Transactions');
  }

  /** Navigate to the Charts (dashboard) tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  /** Click a month button by 0-indexed month (0=Jan, 1=Feb, 2=Mar). */
  async selectMonth(month: 0 | 1 | 2) {
    const buttons = [this.janButton, this.febButton, this.marButton];
    await buttons[month].click();
  }

  /**
   * Read the displayed value text of a KPI stat card.
   * The structure is: label → sibling value paragraph.
   */
  async getKpiValue(label: 'Total Spent' | 'Monthly Income' | 'Net Savings' | 'Transactions'): Promise<string | null> {
    // Each stat card has a label <p> and a value <p> as siblings inside a <div>
    return this.page
      .getByText(label)
      .first()
      .locator('..')   // parent div
      .locator('p')
      .nth(1)          // the value paragraph
      .textContent();
  }
}
