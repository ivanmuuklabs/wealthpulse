import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — page object for the Charts (Overview) tab.
 *
 * The sidebar nav item is labelled "Charts" but the page heading says "Overview".
 * KPI cards show: Total Spent, Monthly Income, Net Savings, Transactions.
 * Month switcher buttons: Jan, Feb, Mar (indices 0, 1, 2).
 */
export class DashboardPage {
  /** Sidebar navigation button that activates this tab */
  readonly navButton: Locator;
  /** Main "Overview" heading — visible once the tab is active */
  readonly heading: Locator;
  /** Month selector buttons (Jan / Feb / Mar) */
  readonly monthButtons: Locator;
  /** "Total Spent" KPI card root */
  readonly totalSpentCard: Locator;
  /** "Monthly Income" KPI card root */
  readonly monthlyIncomeCard: Locator;
  /** "Net Savings" KPI card root */
  readonly netSavingsCard: Locator;
  /** "Transactions" KPI card root */
  readonly transactionsCard: Locator;
  /** Budget Alerts section heading */
  readonly budgetAlertsHeading: Locator;
  /** Recent Transactions section heading */
  readonly recentTransactionsHeading: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: /charts/i });
    this.heading = page.getByRole('heading', { name: 'Overview' });
    // Month buttons are inside the month-picker bar (Jan, Feb, Mar)
    this.monthButtons = page.getByRole('button', { name: /^(Jan|Feb|Mar)$/ });
    this.totalSpentCard = page.getByText('Total Spent').locator('..');
    this.monthlyIncomeCard = page.getByText('Monthly Income').locator('..');
    this.netSavingsCard = page.getByText('Net Savings').locator('..');
    this.transactionsCard = page.getByText('Transactions').locator('..');
    this.budgetAlertsHeading = page.getByText('Budget Alerts');
    this.recentTransactionsHeading = page.getByText('Recent Transactions');
  }

  /** Click the sidebar Charts button to navigate here */
  async navigate() {
    await this.navButton.click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Switch the active month (0=Jan, 1=Feb, 2=Mar) */
  async selectMonth(index: 0 | 1 | 2) {
    await this.monthButtons.nth(index).click();
  }

  /**
   * Return the text content of the KPI value inside the card that contains
   * the given label text (e.g. "Total Spent").
   */
  async getKpiValue(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .locator('p.text-xl')
      .textContent();
  }
}
