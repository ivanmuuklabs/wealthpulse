import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — page object for the Charts / Overview section.
 *
 * Covers: KPI cards, month selector buttons, budget alert section,
 * and the recent transactions list.
 */
export class DashboardPage {
  // Month selector buttons (Jan=0, Feb=1, Mar=2)
  readonly monthButtons: Locator;

  // KPI stat cards
  readonly totalSpentCard: Locator;
  readonly monthlyIncomeCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;

  // Budget alerts section heading
  readonly budgetAlertsHeading: Locator;

  // Recent transactions list
  readonly recentTransactionRows: Locator;

  // Overview heading (confirms we are on this view)
  readonly overviewHeading: Locator;

  constructor(private page: Page) {
    this.monthButtons = page.getByRole('button', { name: /^(Jan|Feb|Mar)$/ });

    // KPI cards are identified by their label text
    this.totalSpentCard   = page.getByText('Total Spent').first();
    this.monthlyIncomeCard = page.getByText('Monthly Income').first();
    this.netSavingsCard   = page.getByText('Net Savings').first();
    this.transactionsCard = page.getByText('Transactions').first();

    this.budgetAlertsHeading = page.getByText('Budget Alerts');
    this.recentTransactionRows = page.locator('text=Recent Transactions').locator('..').locator('div.flex.items-center.gap-3.py-2');
    this.overviewHeading = page.getByRole('heading', { name: 'Overview' });
  }

  /** Navigate to the dashboard by clicking the Charts sidebar item. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
    await this.overviewHeading.waitFor({ state: 'visible' });
  }

  /** Click a month button by short name ('Jan' | 'Feb' | 'Mar'). */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /**
   * Read the displayed dollar value from a KPI card by its label text.
   * The value is the sibling bold text that starts with '$'.
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
