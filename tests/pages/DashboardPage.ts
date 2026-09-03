import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly heading: Locator;
  readonly monthlyIncomeCard: Locator;
  readonly totalSpentCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;
  readonly budgetAlertsSection: Locator;
  readonly recentTransactionsList: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Overview' });
    this.monthlyIncomeCard = page.getByText('Monthly Income').locator('..');
    this.totalSpentCard = page.getByText('Total Spent').locator('..');
    this.netSavingsCard = page.getByText('Net Savings').locator('..');
    this.transactionsCard = page.getByText('Transactions').locator('..');
    this.budgetAlertsSection = page.getByText('Budget Alerts').locator('..');
    this.recentTransactionsList = page.getByText('Recent Transactions').locator('..');
  }

  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /** Returns the text of the KPI value shown directly inside a stat card. */
  async getKpiValue(label: 'Monthly Income' | 'Total Spent' | 'Net Savings' | 'Transactions') {
    const card = this.page.getByText(label, { exact: false }).locator('..');
    return card.getByText(/[\$\d]/).first().textContent();
  }
}
