import { Page, Locator } from '@playwright/test';
import { parseMoney } from '../helpers/money';

export class DashboardPage {
  readonly totalSpentValue: Locator;
  readonly transactionsValue: Locator;

  constructor(private page: Page) {
    // Each KPI card renders: label <p>, value <p>, optional sub <p>.
    this.totalSpentValue = page
      .getByText('Total Spent', { exact: true })
      .locator('xpath=following-sibling::p[1]');
    this.transactionsValue = page
      .getByText('Transactions', { exact: true })
      .locator('xpath=following-sibling::p[1]');
  }

  /** Opens the dashboard via the sidebar item labelled "Charts". */
  async navigate() {
    await this.page.getByRole('button', { name: 'Charts', exact: true }).click();
    await this.page.getByRole('heading', { name: 'Overview' }).waitFor();
  }

  async getTotalSpent(): Promise<number> {
    return parseMoney(await this.totalSpentValue.innerText());
  }

  async getTransactionCount(): Promise<number> {
    return parseInt(await this.transactionsValue.innerText(), 10);
  }
}
