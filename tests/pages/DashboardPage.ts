import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Dashboard (Charts) section.
 *
 * Covers: month selector, KPI cards, Budget Alerts, and Recent Transactions.
 */
export class DashboardPage {
  /** The month selector buttons — Jan, Feb, Mar */
  readonly monthButtons: Locator;

  /** KPI card labels */
  readonly monthlyIncomeCard: Locator;
  readonly totalSpentCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;

  /** Budget Alerts section heading */
  readonly budgetAlertsSection: Locator;

  /** Individual alert rows inside the Budget Alerts card */
  readonly budgetAlertRows: Locator;

  /** Recent Transactions list container */
  readonly recentTransactionsSection: Locator;

  /** Individual rows in the Recent Transactions list */
  readonly recentTransactionRows: Locator;

  constructor(private page: Page) {
    this.monthButtons = page.locator('button', { hasText: /^(Jan|Feb|Mar)$/ });

    this.monthlyIncomeCard = page.getByText('Monthly Income');
    this.totalSpentCard    = page.getByText('Total Spent');
    this.netSavingsCard    = page.getByText('Net Savings');
    this.transactionsCard  = page.getByText('Transactions');

    // Budget Alerts heading text
    this.budgetAlertsSection = page.getByText('Budget Alerts');

    // Each alert row contains a category name plus spent/budget amounts
    this.budgetAlertRows = page
      .locator('div')
      .filter({ hasText: /Budget Alerts/ })
      .locator('..')
      .locator('div[class*="flex"]')
      .filter({ hasText: /\$[\d,]+/ });

    // Recent Transactions section
    this.recentTransactionsSection = page.getByText('Recent Transactions');

    // Transaction rows — each shows a category icon, description, and a red amount
    this.recentTransactionRows = page
      .locator('div')
      .filter({ hasText: /Recent Transactions/ })
      .locator('..')
      .locator('div[class*="flex"]')
      .filter({ hasText: /\$[\d,]+/ });
  }

  /** Navigate to the Dashboard from anywhere in the authenticated app. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
    await this.page.getByRole('heading', { name: 'Overview' }).waitFor({ state: 'visible' });
  }

  /** Click a month button by label (e.g. 'Jan', 'Feb', 'Mar'). */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /**
   * Read the dollar value shown inside a KPI card.
   * Finds the first text matching a dollar pattern inside the card's parent container.
   */
  async getKpiValue(label: string): Promise<string> {
    return (
      (await this.page
        .getByText(label)
        .locator('..')
        .getByText(/\$[\d,]+(\.\d+)?/)
        .first()
        .textContent()) ?? ''
    );
  }
}
