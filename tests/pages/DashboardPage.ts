import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — page object for the Charts (Dashboard) tab.
 *
 * Encapsulates locators and interactions for:
 *   - Month selector buttons (Jan / Feb / Mar)
 *   - KPI stat cards (Total Spent, Monthly Income, Net Savings, Transactions)
 *   - Budget alerts section
 *   - Recent transactions list
 */
export class DashboardPage {
  readonly overviewHeading: Locator;
  readonly monthButtons: { jan: Locator; feb: Locator; mar: Locator };
  readonly kpiTotalSpent: Locator;
  readonly kpiMonthlyIncome: Locator;
  readonly kpiNetSavings: Locator;
  readonly kpiTransactions: Locator;
  readonly budgetAlertsSection: Locator;
  readonly recentTransactionsSection: Locator;

  constructor(private page: Page) {
    this.overviewHeading = page.getByRole('heading', { name: 'Overview' });

    // Month selector buttons visible in the dashboard header row
    this.monthButtons = {
      jan: page.getByRole('button', { name: 'Jan' }),
      feb: page.getByRole('button', { name: 'Feb' }),
      mar: page.getByRole('button', { name: 'Mar' }),
    };

    // KPI cards — locate by label text
    this.kpiTotalSpent = page.getByText('Total Spent');
    this.kpiMonthlyIncome = page.getByText('Monthly Income');
    this.kpiNetSavings = page.getByText('Net Savings');
    this.kpiTransactions = page.getByText('Transactions');

    this.budgetAlertsSection = page.getByText('Budget Alerts');
    this.recentTransactionsSection = page.getByText('Recent Transactions');
  }

  /** Navigate to the Charts (dashboard) tab via the sidebar. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
    await this.overviewHeading.waitFor({ state: 'visible' });
  }

  /** Click one of the month selector buttons and wait for the view to update. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.monthButtons[month.toLowerCase() as 'jan' | 'feb' | 'mar'].click();
  }

  /**
   * Return the text content of the value element inside a KPI card.
   * The KPI card structure is:  <label text> → parent → <bold value text>
   */
  async getKpiValue(labelText: string): Promise<string | null> {
    return this.page
      .getByText(labelText)
      .locator('..')
      .locator('p.text-xl')
      .first()
      .textContent();
  }
}
