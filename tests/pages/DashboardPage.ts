import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — page object for the Dashboard (Charts) tab.
 *
 * Covers: month selector, KPI stat cards, Budget Alerts section,
 * and the Recent Transactions list.
 */
export class DashboardPage {
  // Month selector buttons
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // KPI stat cards (located by their label text)
  readonly totalSpentCard: Locator;
  readonly monthlyIncomeCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;

  // Sections
  readonly budgetAlertsSection: Locator;
  readonly recentTransactionsSection: Locator;

  constructor(private page: Page) {
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    // Navigate up one level (..) from the label text to reach the card container
    this.totalSpentCard       = page.getByText('Total Spent').locator('..');
    this.monthlyIncomeCard    = page.getByText('Monthly Income').locator('..');
    this.netSavingsCard       = page.getByText('Net Savings').locator('..');
    this.transactionsCard     = page.getByText('Transactions').locator('..');

    this.budgetAlertsSection      = page.getByText('Budget Alerts').locator('..');
    this.recentTransactionsSection = page.getByText('Recent Transactions').locator('..');
  }

  /** Navigate to the Dashboard (Charts) tab from any authenticated state. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
    await this.page.getByText('Overview').waitFor({ state: 'visible' });
  }

  /** Click a month selector button. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    const buttons = { Jan: this.janButton, Feb: this.febButton, Mar: this.marButton };
    await buttons[month].first().click();
  }

  /**
   * Returns the dollar value text from inside a KPI stat card.
   * Each card contains a single `$X,XXX.XX` text node.
   */
  async getKpiValue(card: Locator): Promise<string> {
    return (await card.locator('text=/\\$[\\d,]+/').first().textContent()) ?? '';
  }
}
