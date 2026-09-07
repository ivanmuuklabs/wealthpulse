import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly monthlyIncomeCard: Locator;
  readonly totalSpentCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;
  readonly recentTransactionsList: Locator;
  readonly budgetAlertsSection: Locator;

  constructor(private page: Page) {
    // KPI stat cards — identified by their label text
    this.monthlyIncomeCard = page.getByText('Monthly Income').locator('..');
    this.totalSpentCard = page.getByText('Total Spent').locator('..');
    this.netSavingsCard = page.getByText('Net Savings').locator('..');
    this.transactionsCard = page.getByText('Transactions').locator('..');

    // Recent Transactions section — locate by section heading
    this.recentTransactionsList = page.getByText('Recent Transactions').locator('..');

    // Budget Alerts section
    this.budgetAlertsSection = page.getByText('Budget Alerts').locator('..');
  }

  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  /** Click a month selector button by abbreviated name: 'Jan' | 'Feb' | 'Mar' */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /**
   * Return the text content of the primary value in a KPI card.
   * The card container is passed so we can pull the first dollar-amount child.
   */
  async getKpiValue(card: Locator): Promise<string> {
    const value = await card
      .locator('text=/\\$[\\d,]+(\\.\\d+)?/')
      .first()
      .textContent();
    return value?.trim() ?? '';
  }
}
