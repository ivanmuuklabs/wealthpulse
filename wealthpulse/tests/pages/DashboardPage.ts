import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly monthlyIncomeCard: Locator;
  readonly totalSpentCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;
  readonly recentTransactionRows: Locator;
  readonly budgetAlerts: Locator;

  constructor(private page: Page) {
    this.monthlyIncomeCard = page.getByText('Monthly Income');
    this.totalSpentCard = page.getByText('Total Spent');
    this.netSavingsCard = page.getByText('Net Savings');
    this.transactionsCard = page.getByText('Transactions');
    // Each row in the recent transactions list
    this.recentTransactionRows = page.locator('[data-testid="transaction-row"], ul li, .space-y-2 > div').filter({ hasText: /\-\$/ });
    // Budget alert progress bars
    this.budgetAlerts = page.locator('[data-testid="budget-alert"], .budget-alert, div').filter({ hasText: /\$.*\/.*\$/ });
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  async getKpiValue(label: string): Promise<string> {
    // Returns the text content of the value element sibling to the given label
    const card = this.page.locator('div').filter({ hasText: label }).first();
    return (await card.textContent()) ?? '';
  }

  async getTotalSpentText(): Promise<string> {
    // Locate the stat card that contains "Total Spent" and return its full text
    const card = this.page
      .locator('div')
      .filter({ hasText: /Total Spent/ })
      .first();
    return (await card.textContent()) ?? '';
  }
}
