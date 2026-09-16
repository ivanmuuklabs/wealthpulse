import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — page object for the Charts (Dashboard) tab.
 *
 * Covers: month selector, KPI stat cards, chart headings,
 * Budget Alerts panel, and Recent Transactions section.
 */
export class DashboardPage {
  readonly overviewHeading: Locator;
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;
  readonly totalSpentCard: Locator;
  readonly monthlyIncomeCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;
  readonly spendingByCategoryHeading: Locator;
  readonly cumulativeSpendingHeading: Locator;
  readonly monthlyComparisonHeading: Locator;
  readonly budgetAlertsHeading: Locator;
  readonly recentTransactionsHeading: Locator;

  constructor(private page: Page) {
    this.overviewHeading = page.getByRole('heading', { name: 'Overview' });

    // Month selector buttons
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    // KPI stat cards (by label text)
    this.totalSpentCard = page.getByText('Total Spent');
    this.monthlyIncomeCard = page.getByText('Monthly Income');
    this.netSavingsCard = page.getByText('Net Savings');
    this.transactionsCard = page.getByText('Transactions');

    // Chart section headings
    this.spendingByCategoryHeading = page.getByText('Spending by Category');
    this.cumulativeSpendingHeading = page.getByText('Cumulative Spending');
    this.monthlyComparisonHeading = page.getByText('Monthly Comparison');

    // Budget Alerts & Recent Transactions panels
    this.budgetAlertsHeading = page.getByText('Budget Alerts');
    this.recentTransactionsHeading = page.getByText('Recent Transactions');
  }

  /** Navigate to the Charts / Dashboard tab from the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
    await this.overviewHeading.waitFor({ state: 'visible' });
  }

  /** Click a month selector button by index (0 = Jan, 1 = Feb, 2 = Mar). */
  async selectMonthByIndex(index: 0 | 1 | 2) {
    const buttons = [this.janButton, this.febButton, this.marButton];
    await buttons[index].click();
  }

  /**
   * Return the raw text of a KPI stat-card value element.
   * The value sits in the `text-xl font-bold` paragraph immediately
   * after the label paragraph inside the card.
   */
  async getKpiValue(label: string): Promise<string> {
    const card = this.page
      .locator('.rounded-2xl')
      .filter({ hasText: label })
      .first();
    // The value is the second <p> inside the card's text container
    return card.locator('p.text-xl').innerText();
  }
}
