import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Dashboard (Charts) tab.
 * Encapsulates locators and actions for the Overview page,
 * including the month selector, KPI cards, budget alerts,
 * and recent transactions list.
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
    // KPI stat cards — matched by their visible label text
    this.monthlyIncomeCard = page.getByText('Monthly Income');
    this.totalSpentCard    = page.getByText('Total Spent').first();
    this.netSavingsCard    = page.getByText('Net Savings');
    this.transactionsCard  = page.getByText('Transactions').first();
    this.budgetAlertsSection       = page.getByText('Budget Alerts');
    this.recentTransactionsSection = page.getByText('Recent Transactions');
  }

  /** Navigate to the Dashboard tab via the sidebar button. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  /** Click a month button in the Dashboard month selector (0=Jan,1=Feb,2=Mar). */
  async selectMonth(shortName: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: shortName }).click();
  }

  /**
   * Read the text value of a KPI card that wraps the given label.
   * Returns the dollar-formatted amount string shown below the label.
   */
  async getKpiValue(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .locator('text=/\\$[\\d,]+/')
      .first()
      .textContent();
  }

  /** Read the transaction count shown in the Transactions KPI card. */
  async getTransactionCount(): Promise<string | null> {
    return this.page
      .getByText('Transactions')
      .first()
      .locator('..')
      .locator('p.text-xl')
      .textContent();
  }
}
