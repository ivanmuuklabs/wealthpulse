import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage
 *
 * Encapsulates locators and helpers for the Dashboard (Charts) tab —
 * the first screen users land on after login.
 */
export class DashboardPage {
  readonly heading: Locator;

  // Month selector buttons
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // KPI stat cards
  readonly monthlyIncomeCard: Locator;
  readonly totalSpentCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;

  // Chart section headings
  readonly spendingByCategoryHeading: Locator;
  readonly cumulativeSpendingHeading: Locator;
  readonly monthlyComparisonHeading: Locator;

  // Budget Alerts section
  readonly budgetAlertsSection: Locator;
  readonly budgetAlertItems: Locator;

  // Recent Transactions section
  readonly recentTransactionsHeading: Locator;
  readonly recentTransactionRows: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Overview' });

    // Month selector buttons in the Dashboard header
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    // KPI cards — identified by their label text
    this.monthlyIncomeCard = page.locator('div', { hasText: 'Monthly Income' }).first();
    this.totalSpentCard = page.locator('div', { hasText: 'Total Spent' }).first();
    this.netSavingsCard = page.locator('div', { hasText: 'Net Savings' }).first();
    this.transactionsCard = page.locator('div', { hasText: 'Transactions' }).first();

    // Chart headings
    this.spendingByCategoryHeading = page.getByRole('heading', {
      name: /spending by category/i,
    });
    this.cumulativeSpendingHeading = page.getByRole('heading', {
      name: /cumulative spending/i,
    });
    this.monthlyComparisonHeading = page.getByRole('heading', {
      name: /monthly comparison/i,
    });

    // Budget Alerts
    this.budgetAlertsSection = page.locator('div', { hasText: /budget alerts/i }).first();
    // Each alert item is a flex row inside the alerts card
    this.budgetAlertItems = page
      .locator('div', { hasText: /budget alerts/i })
      .first()
      .locator('ul > li, .space-y-3 > div');

    // Recent Transactions
    this.recentTransactionsHeading = page.getByRole('heading', {
      name: /recent transactions/i,
    });
    // Each row in the recent-transactions list
    this.recentTransactionRows = page
      .locator('div', { hasText: /recent transactions/i })
      .first()
      .locator('.space-y-3 > div, ul > li');
  }

  /** Navigate to the Dashboard (Charts) tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Switch the active month and wait for the UI to settle. */
  async switchMonth(month: 'Jan' | 'Feb' | 'Mar') {
    const btn =
      month === 'Jan'
        ? this.janButton
        : month === 'Feb'
        ? this.febButton
        : this.marButton;
    await btn.click();
  }

  /**
   * Read the dollar value displayed inside a KPI card.
   * Returns the raw text content (e.g. "$6,500.00").
   */
  async kpiValue(cardLocator: Locator): Promise<string> {
    return (
      (await cardLocator.locator('text=/\\$[\\d,]+(\\.\\d+)?/').first().textContent()) ?? ''
    );
  }
}
