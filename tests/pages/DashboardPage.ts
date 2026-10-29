import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Dashboard (Overview) tab.
 *
 * Covers: month selector, the four KPI stat cards, chart section headings,
 * Budget Alerts section, and the Recent Transactions list.
 */
export class DashboardPage {
  readonly heading: Locator;

  // Month selector buttons (Jan=0, Feb=1, Mar=2)
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // KPI stat cards — located by their label text
  readonly totalSpentCard: Locator;
  readonly monthlyIncomeCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;

  // Chart section headings
  readonly spendingByCategoryHeading: Locator;
  readonly cumulativeSpendingHeading: Locator;
  readonly monthlyComparisonHeading: Locator;

  // Budget Alerts section
  readonly budgetAlertsHeading: Locator;

  // Recent Transactions section
  readonly recentTransactionsHeading: Locator;
  readonly recentTransactionRows: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Overview' });

    // Month buttons inside the pill selector
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    // KPI cards — each StatCard renders the label as a small uppercase paragraph
    this.totalSpentCard = page.getByText('Total Spent').first();
    this.monthlyIncomeCard = page.getByText('Monthly Income').first();
    this.netSavingsCard = page.getByText('Net Savings').first();
    this.transactionsCard = page.getByText('Transactions').first();

    // Chart headings (h3 elements inside Card components)
    this.spendingByCategoryHeading = page.getByRole('heading', { name: 'Spending by Category' });
    this.cumulativeSpendingHeading = page.getByRole('heading', { name: 'Cumulative Spending' });
    this.monthlyComparisonHeading = page.getByRole('heading', { name: 'Monthly Comparison' });

    // Budget Alerts — only rendered when at least one category exceeds 50%
    this.budgetAlertsHeading = page.getByRole('heading', { name: 'Budget Alerts' });

    // Recent Transactions
    this.recentTransactionsHeading = page.getByRole('heading', { name: 'Recent Transactions' });
    // Each recent transaction row contains a category icon, description, and amount
    this.recentTransactionRows = page
      .locator('div')
      .filter({ hasText: /Recent Transactions/ })
      .locator('.. >> div.flex.items-center.gap-3');
  }

  /** Navigate to the Dashboard tab via the sidebar */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
  }

  /** Switch to a given month (0=Jan, 1=Feb, 2=Mar) */
  async selectMonth(m: 0 | 1 | 2) {
    const buttons = [this.janButton, this.febButton, this.marButton];
    await buttons[m].click();
  }

  /**
   * Read the text content of a KPI value — the bold white number
   * rendered directly under the label inside a StatCard.
   */
  async getKpiValue(label: 'Total Spent' | 'Monthly Income' | 'Net Savings' | 'Transactions') {
    // The value is in the next sibling <p> after the label <p>
    const labelEl = this.page.locator('p').filter({ hasText: new RegExp(`^${label}$`, 'i') }).first();
    const valueEl = labelEl.locator('~ p').first();
    return valueEl.textContent();
  }
}
