import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  // Month selector buttons
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // KPI stat cards
  readonly monthlyIncomeCard: Locator;
  readonly totalSpentCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;

  // Budget alerts section
  readonly budgetAlertsSection: Locator;

  // Recent transactions list
  readonly recentTransactionsList: Locator;

  constructor(private page: Page) {
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    this.monthlyIncomeCard = page.getByText('Monthly Income');
    this.totalSpentCard     = page.getByText('Total Spent').first();
    this.netSavingsCard     = page.getByText('Net Savings');
    this.transactionsCard   = page.getByText('Transactions').first();

    this.budgetAlertsSection      = page.getByText('Budget Alerts');
    this.recentTransactionsList   = page.getByText('Recent Transactions');
  }

  async navigate() {
    await this.page.getByRole('button', { name: /dashboard/i }).click();
    await this.page.getByRole('heading', { name: 'Overview' }).waitFor({ state: 'visible' });
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    const btn = { Jan: this.janButton, Feb: this.febButton, Mar: this.marButton }[month];
    await btn.click();
  }

  /**
   * Returns the text content of the value element inside a KPI card
   * identified by its label text (e.g. "Total Spent").
   */
  async getKpiValue(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .locator('p.text-xl')
      .first()
      .textContent();
  }
}
