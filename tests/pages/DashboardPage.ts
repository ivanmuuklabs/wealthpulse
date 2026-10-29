import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Dashboard (Overview) tab.
 *
 * Covers:
 *  - Month selector buttons (Jan / Feb / Mar)
 *  - KPI stat cards (Total Spent, Monthly Income, Net Savings, Transactions)
 *  - Chart section headings
 *  - Budget Alerts card
 *  - Recent Transactions card
 */
export class DashboardPage {
  // Navigation: the "Charts" sidebar button routes to the Dashboard
  readonly navButton: Locator;

  // Month selector buttons
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // Page heading
  readonly overviewHeading: Locator;

  // KPI stat cards (by their label text)
  readonly totalSpentCard: Locator;
  readonly monthlyIncomeCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;

  // Chart headings
  readonly spendingByCategoryHeading: Locator;
  readonly cumulativeSpendingHeading: Locator;
  readonly monthlyComparisonHeading: Locator;

  // Budget Alerts card
  readonly budgetAlertsHeading: Locator;

  // Recent Transactions card
  readonly recentTransactionsHeading: Locator;
  readonly recentTransactionRows: Locator;

  constructor(private page: Page) {
    this.navButton = page.getByRole('button', { name: 'Charts' });

    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    this.overviewHeading = page.getByRole('heading', { name: 'Overview' });

    // StatCards render the label in a small <p> tag; we locate the card by its label
    this.totalSpentCard = page.locator('p', { hasText: 'Total Spent' }).first();
    this.monthlyIncomeCard = page.locator('p', { hasText: 'Monthly Income' }).first();
    this.netSavingsCard = page.locator('p', { hasText: 'Net Savings' }).first();
    this.transactionsCard = page.locator('p', { hasText: 'Transactions' }).first();

    this.spendingByCategoryHeading = page.getByText('Spending by Category');
    this.cumulativeSpendingHeading = page.getByText('Cumulative Spending');
    this.monthlyComparisonHeading = page.getByText('Monthly Comparison');

    this.budgetAlertsHeading = page.getByText('Budget Alerts');

    this.recentTransactionsHeading = page.getByText('Recent Transactions');
    // Recent transaction rows: each row has an icon, description, and red amount
    this.recentTransactionRows = page.locator('div').filter({ hasText: /^.+· 2026-/ }).filter({ has: page.locator('span.text-red-400') });
  }

  async navigate() {
    await this.navButton.click();
  }

  /** Read the dollar value displayed directly inside a KPI stat card by label */
  async getKpiValue(label: 'Total Spent' | 'Monthly Income' | 'Net Savings' | 'Transactions'): Promise<string> {
    // The value is the bold <p> immediately after the label inside the same card
    const card = this.page.locator('div').filter({ has: this.page.locator('p', { hasText: label }) }).first();
    const value = await card.locator('p.text-xl').first().textContent();
    return value?.trim() ?? '';
  }
}
