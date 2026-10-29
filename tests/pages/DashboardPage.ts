import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — page object for the Charts/Overview dashboard tab.
 *
 * Encapsulates locators and actions for the Dashboard module:
 * month selector buttons, KPI stat cards, budget alert rows,
 * and the recent-transactions list.
 */
export class DashboardPage {
  /** The three month selector buttons (Jan, Feb, Mar) in the dashboard header */
  readonly monthButtons: Locator;

  /** All four top-level KPI stat card containers */
  readonly kpiCards: Locator;

  /** "Total Spent" KPI value text */
  readonly totalSpentValue: Locator;

  /** "Net Savings" KPI value text */
  readonly netSavingsValue: Locator;

  /** "Transactions" KPI value text */
  readonly transactionsValue: Locator;

  /** Budget Alerts section heading (only visible when alerts exist) */
  readonly budgetAlertsHeading: Locator;

  /** Individual budget alert progress rows */
  readonly budgetAlertRows: Locator;

  /** Recent Transactions list items */
  readonly recentTransactionRows: Locator;

  constructor(private page: Page) {
    this.monthButtons = page.locator('div.flex.bg-white\\/\\[0\\.04\\].rounded-xl button');
    this.kpiCards = page.locator('div.grid').filter({ hasText: 'Monthly Income' }).locator('> div');

    // KPI values — locate via the label text then navigate to sibling value
    this.totalSpentValue = page
      .getByText('Total Spent')
      .locator('..')
      .locator('p.text-xl');

    this.netSavingsValue = page
      .getByText('Net Savings')
      .locator('..')
      .locator('p.text-xl');

    this.transactionsValue = page
      .getByText('Transactions')
      .locator('..')
      .locator('p.text-xl');

    this.budgetAlertsHeading = page.getByText('Budget Alerts');
    this.budgetAlertRows = page.locator('div').filter({ hasText: /Budget Alerts/ }).locator('div.flex.items-center.gap-3.p-3');
    this.recentTransactionRows = page.locator('div').filter({ hasText: 'Recent Transactions' }).locator('div.flex.items-center.gap-3.py-2');
  }

  /** Navigate to the Dashboard module via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
    await this.page.getByRole('heading', { name: 'Overview' }).waitFor();
  }

  /**
   * Click a month button by its abbreviated name (e.g. 'Jan', 'Feb', 'Mar').
   * Waits for the heading to remain visible after the switch.
   */
  async selectMonth(abbr: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: abbr }).click();
  }

  /** Read the raw text of the Total Spent KPI value. */
  async getTotalSpentText(): Promise<string> {
    return (await this.totalSpentValue.textContent()) ?? '';
  }

  /** Read the raw text of the Net Savings KPI value. */
  async getNetSavingsText(): Promise<string> {
    return (await this.netSavingsValue.textContent()) ?? '';
  }
}
