import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Dashboard (Charts) tab.
 * Encapsulates locators and actions for KPI cards, month selector,
 * budget alerts, and the recent-transactions list.
 */
export class DashboardPage {
  /** Month selector buttons (Jan / Feb / Mar) */
  readonly monthButtons: Locator;
  /** "Total Spent" KPI card root */
  readonly totalSpentCard: Locator;
  /** "Net Savings" KPI card root */
  readonly netSavingsCard: Locator;
  /** "Transactions" KPI card root */
  readonly transactionsCard: Locator;
  /** "Monthly Income" KPI card root */
  readonly monthlyIncomeCard: Locator;
  /** Budget Alerts section heading */
  readonly budgetAlertsHeading: Locator;
  /** Recent Transactions list container */
  readonly recentTransactions: Locator;
  /** Individual transaction rows */
  readonly transactionRows: Locator;

  constructor(private page: Page) {
    this.monthButtons = page.locator('div.flex > button').filter({ hasText: /^(Jan|Feb|Mar)$/ });
    this.totalSpentCard = page.getByText('Total Spent').first().locator('..');
    this.netSavingsCard = page.getByText('Net Savings').locator('..');
    this.transactionsCard = page.getByText('Transactions').locator('..');
    this.monthlyIncomeCard = page.getByText('Monthly Income').locator('..');
    this.budgetAlertsHeading = page.getByText('Budget Alerts');
    this.recentTransactions = page.getByText('Recent Transactions').locator('..').locator('..');
    this.transactionRows = this.recentTransactions.locator('div.flex.items-center.gap-3.py-2');
  }

  /** Navigate to the Dashboard by clicking the Charts sidebar button */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  /** Click a month selector button by its short name (Jan, Feb, Mar) */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).first().click();
  }

  /**
   * Read the dollar value displayed in a KPI card identified by its label.
   * Returns the raw text of the first $-prefixed amount found.
   */
  async getKpiValue(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();
  }
}
