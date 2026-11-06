import { Page, Locator } from '@playwright/test';
import { parseMoney } from '../helpers/money';

export class BudgetsPage {
  readonly totalSpentValue: Locator;
  readonly remainingValue: Locator;

  constructor(private page: Page) {
    // Each KPI card renders: label <p>, value <p>, optional sub <p>.
    this.totalSpentValue = page
      .getByText('Total Spent', { exact: true })
      .locator('xpath=following-sibling::p[1]');
    this.remainingValue = page
      .getByText('Remaining', { exact: true })
      .locator('xpath=following-sibling::p[1]');
  }

  async navigate() {
    await this.page.getByRole('button', { name: 'Budgets', exact: true }).click();
    await this.page.getByRole('heading', { name: 'Budgets', exact: true }).waitFor();
  }

  async getTotalSpent(): Promise<number> {
    return parseMoney(await this.totalSpentValue.innerText());
  }

  async getRemaining(): Promise<number> {
    return parseMoney(await this.remainingValue.innerText());
  }
}
