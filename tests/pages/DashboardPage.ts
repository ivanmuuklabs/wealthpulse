import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly monthButtons: { jan: Locator; feb: Locator; mar: Locator };
  readonly monthlyIncomeCard: Locator;
  readonly totalSpentCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCountCard: Locator;
  readonly budgetAlertsSection: Locator;
  readonly recentTransactionsList: Locator;

  constructor(private page: Page) {
    this.monthButtons = {
      jan: page.getByRole('button', { name: 'Jan' }),
      feb: page.getByRole('button', { name: 'Feb' }),
      mar: page.getByRole('button', { name: 'Mar' }),
    };
    // KPI stat cards — located by their label text, then traverse to the sibling value
    this.monthlyIncomeCard = page.getByText('Monthly Income').locator('..');
    this.totalSpentCard    = page.getByText('Total Spent').locator('..');
    this.netSavingsCard    = page.getByText('Net Savings').locator('..');
    this.transactionsCountCard = page.getByText('Transactions').locator('..');

    // Budget Alerts section header
    this.budgetAlertsSection = page.getByText('Budget Alerts').locator('..');

    // Recent Transactions list container
    this.recentTransactionsList = page.getByText('Recent Transactions').locator('..');
  }

  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.monthButtons[month.toLowerCase() as 'jan' | 'feb' | 'mar'].click();
  }

  /** Returns the text of the primary dollar value inside a KPI card. */
  async getKpiValue(card: Locator): Promise<string> {
    return (await card.locator('text=/\\$[\\d,]+/').first().textContent()) ?? '';
  }
}
