import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Dashboard (Charts) section.
 * Covers KPI cards, month selector, budget alerts, and recent transactions.
 */
export class DashboardPage {
  readonly monthSelector: { jan: Locator; feb: Locator; mar: Locator };
  readonly kpiMonthlyIncome: Locator;
  readonly kpiTotalSpent: Locator;
  readonly kpiNetSavings: Locator;
  readonly kpiTransactions: Locator;
  readonly budgetAlertsSection: Locator;
  readonly recentTransactionRows: Locator;
  readonly overviewHeading: Locator;

  constructor(private page: Page) {
    this.monthSelector = {
      jan: page.getByRole('button', { name: 'Jan' }),
      feb: page.getByRole('button', { name: 'Feb' }),
      mar: page.getByRole('button', { name: 'Mar' }),
    };

    // KPI card labels — each card wraps its label and value in a parent container
    this.kpiMonthlyIncome = page.getByText('Monthly Income');
    this.kpiTotalSpent    = page.getByText('Total Spent').first();
    this.kpiNetSavings    = page.getByText('Net Savings');
    this.kpiTransactions  = page.getByText('Transactions');

    // Budget alerts card header
    this.budgetAlertsSection = page.getByText('Budget Alerts');

    // Each row in the Recent Transactions list shows a negative amount
    this.recentTransactionRows = page
      .locator('ul li, [data-testid="transaction-row"]')
      .filter({ hasText: /\$/ });

    this.overviewHeading = page.getByRole('heading', { name: 'Overview' });
  }

  /** Navigate to Dashboard via sidebar */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
    await this.overviewHeading.waitFor({ state: 'visible' });
  }

  /** Click a month button and wait for KPI cards to be visible */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    await this.monthSelector[month.toLowerCase() as 'jan' | 'feb' | 'mar'].click();
    await this.kpiTotalSpent.waitFor({ state: 'visible' });
  }

  /** Return the text content of the value below a KPI label */
  async getKpiValue(label: Locator): Promise<string> {
    return (
      (await label
        .locator('..')
        .getByText(/\$[\d,]+(\.\d+)?/)
        .first()
        .textContent()) ?? ''
    );
  }
}
