import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the Dashboard (Overview) tab.
 *
 * Covers: KPI stat cards, month selector, Spending by Category donut,
 * Cumulative Spending chart, Budget Alerts panel, and Recent Transactions list.
 */
export class DashboardPage {
  // Sidebar nav button
  readonly sidebarButton: Locator;

  // Month selector buttons
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // KPI stat cards (identified by their label text)
  readonly totalSpentCard: Locator;
  readonly monthlyIncomeCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;

  // Section headings
  readonly overviewHeading: Locator;
  readonly recentTransactionsHeading: Locator;
  readonly budgetAlertsHeading: Locator;

  // Recent Transactions list rows
  readonly recentTransactionRows: Locator;

  // Budget Alerts rows
  readonly budgetAlertRows: Locator;

  constructor(private page: Page) {
    this.sidebarButton = page.getByRole('button', { name: /charts/i });

    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    this.overviewHeading = page.getByRole('heading', { name: 'Overview' });
    this.recentTransactionsHeading = page.getByText('Recent Transactions');
    this.budgetAlertsHeading = page.getByText('Budget Alerts');

    // KPI cards: identified by their label text
    this.totalSpentCard = page.getByText('Total Spent');
    this.monthlyIncomeCard = page.getByText('Monthly Income');
    this.netSavingsCard = page.getByText('Net Savings');
    this.transactionsCard = page.getByText('Transactions');

    // Recent transaction rows: each row has the category icon + description + amount
    this.recentTransactionRows = page.locator('div').filter({ hasText: /^-\$[\d,]+\.\d{2}$/ });

    // Budget alert rows (rendered inside the Budget Alerts card)
    this.budgetAlertRows = page.locator('div').filter({ hasText: /\$[\d,]+\.\d{2} \/ \$[\d,]+\.\d{2}/ });
  }

  /** Navigate to the Dashboard tab via the sidebar. */
  async navigate() {
    await this.sidebarButton.click();
    await this.overviewHeading.waitFor({ state: 'visible' });
  }

  /**
   * Read the visible dollar value from a KPI stat card.
   * Finds the first $... text that is a sibling of the given label.
   */
  async getKpiValue(label: 'Total Spent' | 'Monthly Income' | 'Net Savings'): Promise<string> {
    const value = await this.page
      .getByText(label)
      .locator('..')
      .locator('p.text-xl')
      .first()
      .textContent();
    return value ?? '';
  }

  /** Read the Transactions KPI count (returns raw text, e.g. "24"). */
  async getTransactionCount(): Promise<string> {
    const value = await this.page
      .getByText('Transactions')
      .locator('..')
      .locator('p.text-xl')
      .first()
      .textContent();
    return (value ?? '').trim();
  }
}
