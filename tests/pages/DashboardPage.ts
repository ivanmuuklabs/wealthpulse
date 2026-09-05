import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage encapsulates selectors and interactions for the Dashboard
 * (Charts) section — the overview page shown immediately after login.
 */
export class DashboardPage {
  readonly monthlyIncomeCard: Locator;
  readonly totalSpentCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;
  readonly budgetAlertsSection: Locator;
  readonly recentTransactionsList: Locator;

  constructor(private page: Page) {
    this.monthlyIncomeCard = page.getByText('Monthly Income');
    this.totalSpentCard    = page.getByText('Total Spent');
    this.netSavingsCard    = page.getByText('Net Savings');
    this.transactionsCard  = page.getByText('Transactions');
    this.budgetAlertsSection    = page.getByText('Budget Alerts');
    this.recentTransactionsList = page.getByText('Recent Transactions');
  }

  async navigate() {
    // The sidebar nav item for the dashboard section is labelled "Charts"
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /** Returns the text of the KPI value directly beneath a given card label. */
  async getKpiValue(cardLabel: string): Promise<string | null> {
    return this.page
      .getByText(cardLabel)
      .locator('..')
      .locator('text=/\\$[\\d,]+(\\.\\d{2})?/')
      .first()
      .textContent();
  }
}
