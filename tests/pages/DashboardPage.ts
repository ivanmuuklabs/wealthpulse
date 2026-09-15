import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — page object for the Charts/Dashboard tab.
 *
 * Encapsulates locators for the month selector, KPI stat cards,
 * Budget Alerts section, and Recent Transactions list shown after login.
 */
export class DashboardPage {
  readonly heading: Locator;

  // Month selector buttons (Jan=0, Feb=1, Mar=2)
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // KPI stat cards (located by their label text)
  readonly totalSpentCard: Locator;
  readonly monthlyIncomeCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;

  // Budget Alerts section
  readonly budgetAlertsHeading: Locator;

  // Recent Transactions list
  readonly recentTransactionsHeading: Locator;
  readonly recentTransactionItems: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Overview' });

    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    // KPI cards — locate the value via the label's sibling text
    this.totalSpentCard = page.locator('p', { hasText: 'Total Spent' }).locator('..');
    this.monthlyIncomeCard = page.locator('p', { hasText: 'Monthly Income' }).locator('..');
    this.netSavingsCard = page.locator('p', { hasText: 'Net Savings' }).locator('..');
    this.transactionsCard = page.locator('p', { hasText: 'Transactions' }).locator('..');

    this.budgetAlertsHeading = page.getByText('Budget Alerts');
    this.recentTransactionsHeading = page.getByText('Recent Transactions');

    // Each recent-transaction row contains an icon + description + amount
    this.recentTransactionItems = page
      .locator('div', { hasText: /Recent Transactions/ })
      .last()
      .locator('div.flex.items-center.gap-3.py-2');
  }

  /** Navigate to the Dashboard via the "Charts" sidebar button. */
  async navigate() {
    await this.page.getByRole('button', { name: 'Charts' }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /**
   * Read the displayed value from a KPI stat card.
   * Returns the trimmed text of the bold value element.
   */
  async getKpiValue(label: 'Total Spent' | 'Monthly Income' | 'Net Savings' | 'Transactions'): Promise<string> {
    const card = this.page.locator('p', { hasText: label }).locator('..').locator('p.text-xl');
    return (await card.textContent() ?? '').trim();
  }
}
