import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage — encapsulates selectors and actions for the Dashboard (Charts) section.
 * The dashboard is the landing page after login, accessible via the "Charts" sidebar button.
 */
export class DashboardPage {
  // Month selector buttons
  readonly monthJan: Locator;
  readonly monthFeb: Locator;
  readonly monthMar: Locator;

  // KPI cards (by visible label text)
  readonly monthlyIncomeCard: Locator;
  readonly totalSpentCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;

  // Budget Alerts section
  readonly budgetAlertsSection: Locator;

  // Recent Transactions list container
  readonly recentTransactionsList: Locator;

  constructor(private page: Page) {
    this.monthJan = page.getByRole('button', { name: 'Jan' });
    this.monthFeb = page.getByRole('button', { name: 'Feb' });
    this.monthMar = page.getByRole('button', { name: 'Mar' });

    this.monthlyIncomeCard = page.getByText('Monthly Income');
    this.totalSpentCard    = page.getByText('Total Spent');
    this.netSavingsCard    = page.getByText('Net Savings');
    this.transactionsCard  = page.getByText('Transactions');

    this.budgetAlertsSection = page.getByText('Budget Alerts');

    // Recent transactions section heading
    this.recentTransactionsList = page.getByText('Recent Transactions');
  }

  /** Navigate to the dashboard by clicking the "Charts" sidebar button. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  /** Switch to the given month using the month selector. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    const buttons: Record<string, Locator> = {
      Jan: this.monthJan,
      Feb: this.monthFeb,
      Mar: this.monthMar,
    };
    await buttons[month].click();
  }

  /**
   * Read the dollar amount displayed inside the KPI card that contains `label`.
   * Returns the raw text of the first `$…` token found inside that card.
   */
  async readKpiAmount(label: string): Promise<string | null> {
    return this.page
      .getByText(label)
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();
  }
}
