import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly monthSelector: { jan: Locator; feb: Locator; mar: Locator };
  readonly kpiMonthlyIncome: Locator;
  readonly kpiTotalSpent: Locator;
  readonly kpiNetSavings: Locator;
  readonly kpiTransactions: Locator;
  readonly budgetAlertsSection: Locator;
  readonly recentTransactionsList: Locator;

  constructor(private page: Page) {
    this.monthSelector = {
      jan: page.getByRole('button', { name: 'Jan' }),
      feb: page.getByRole('button', { name: 'Feb' }),
      mar: page.getByRole('button', { name: 'Mar' }),
    };
    this.kpiMonthlyIncome   = page.getByText('Monthly Income');
    this.kpiTotalSpent      = page.getByText('Total Spent');
    this.kpiNetSavings      = page.getByText('Net Savings');
    this.kpiTransactions    = page.getByText('Transactions');
    this.budgetAlertsSection = page.getByText('Budget Alerts');
    this.recentTransactionsList = page.getByText('Recent Transactions');
  }

  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.monthSelector[month.toLowerCase() as 'jan' | 'feb' | 'mar'].click();
  }

  /**
   * Returns the text content of a KPI card's primary value (the $ amount / count).
   * Walks up to the card container and picks the first text that looks like a
   * currency amount or integer count.
   */
  async getKpiValue(label: Locator): Promise<string | null> {
    return label
      .locator('..')
      .getByText(/^\$[\d,]+(\.\d+)?$|^\d+$/)
      .first()
      .textContent();
  }
}
