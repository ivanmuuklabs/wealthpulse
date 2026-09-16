import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — page object for the Charts (Overview) tab.
 * Covers: month switching, KPI cards, budget alerts, and recent transactions.
 */
export class DashboardPage {
  /** Month selector buttons (Jan / Feb / Mar) */
  readonly monthButtons: Locator;

  /** Top-level KPI stat cards (4 on the overview) */
  readonly kpiMonthlyIncome: Locator;
  readonly kpiTotalSpent: Locator;
  readonly kpiNetSavings: Locator;
  readonly kpiTransactions: Locator;

  /** Budget Alerts section heading */
  readonly budgetAlertsHeading: Locator;

  /** Individual budget alert rows */
  readonly budgetAlertItems: Locator;

  /** Recent Transactions list rows */
  readonly recentTransactionRows: Locator;

  constructor(private page: Page) {
    this.monthButtons = page.locator('.flex.bg-white\\/\\[0\\.04\\].rounded-xl button');
    this.kpiMonthlyIncome = page.getByText('Monthly Income');
    this.kpiTotalSpent    = page.getByText('Total Spent').first();
    this.kpiNetSavings    = page.getByText('Net Savings');
    this.kpiTransactions  = page.getByText('Transactions');

    this.budgetAlertsHeading  = page.getByText('Budget Alerts');
    this.budgetAlertItems     = page.locator('h3:has-text("Budget Alerts") ~ div > div');
    this.recentTransactionRows = page.locator('h3:has-text("Recent Transactions") ~ div > div');
  }

  /** Navigate to the Charts (dashboard) section from the sidebar */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  /** Click a month selector button by short name: 'Jan' | 'Feb' | 'Mar' */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).first().click();
  }

  /**
   * Read the dollar value displayed inside a KPI card.
   * @param label  Exact text of the KPI label, e.g. 'Monthly Income'
   */
  async getKpiValue(label: string): Promise<string> {
    const text = await this.page
      .getByText(label)
      .locator('..')
      .locator('p.text-xl')
      .textContent();
    return text?.trim() ?? '';
  }
}
