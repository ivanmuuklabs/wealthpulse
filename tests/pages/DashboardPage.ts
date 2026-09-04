import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Dashboard (Charts) tab.
 *
 * Encapsulates locators and interactions for the Overview page:
 * month switcher, KPI stat cards, budget alerts section, and the
 * recent transactions list.
 */
export class DashboardPage {
  // Month selector buttons (Jan=0, Feb=1, Mar=2)
  readonly monthButtons: Locator;

  // KPI stat card labels
  readonly totalSpentLabel: Locator;
  readonly monthlyIncomeLabel: Locator;
  readonly netSavingsLabel: Locator;
  readonly transactionsLabel: Locator;

  // Overview heading (confirms we are on the Dashboard tab)
  readonly overviewHeading: Locator;

  // Recent transactions list container
  readonly recentTransactionsSection: Locator;

  constructor(private page: Page) {
    this.monthButtons = page.locator('button', { hasText: /^(Jan|Feb|Mar)$/ });
    this.totalSpentLabel = page.getByText('Total Spent').first();
    this.monthlyIncomeLabel = page.getByText('Monthly Income').first();
    this.netSavingsLabel = page.getByText('Net Savings').first();
    this.transactionsLabel = page.getByText('Transactions').first();
    this.overviewHeading = page.getByRole('heading', { name: 'Overview' });
    this.recentTransactionsSection = page.getByText('Recent Transactions');
  }

  /** Navigate to the Dashboard tab by clicking the "Charts" sidebar button. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
    await this.overviewHeading.waitFor({ state: 'visible' });
  }

  /** Click a month button by its short name ('Jan' | 'Feb' | 'Mar'). */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.page.getByRole('button', { name: month }).click();
  }

  /**
   * Read the displayed value from a KPI stat card.
   * Finds the card by its label text and returns the bold value immediately
   * below it (e.g. "$2,345.67" or "18").
   */
  async getKpiValue(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')          // parent container of the label
      .locator('p.text-xl')  // the bold value paragraph inside the card
      .first()
      .textContent();
  }
}
