import { Page, Locator, expect } from '@playwright/test';

/**
 * Page object for the Dashboard (Charts) tab.
 *
 * The dashboard renders:
 *  - A month selector (Jan / Feb / Mar buttons)
 *  - Four KPI stat cards: Total Spent, Monthly Income, Net Savings, Transactions
 *  - Three charts: Spending by Category (donut), Cumulative Spending (area),
 *    Monthly Comparison (bar)
 *  - Budget Alerts section (conditionally rendered when ≥1 category > 50% used)
 *  - Recent Transactions list (up to 8 rows)
 */
export class DashboardPage {
  // Month selector
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  // KPI labels
  readonly totalSpentLabel: Locator;
  readonly monthlyIncomeLabel: Locator;
  readonly netSavingsLabel: Locator;
  readonly transactionsLabel: Locator;

  // Chart headings (used to confirm each chart is rendered)
  readonly spendingByCategoryHeading: Locator;
  readonly cumulativeSpendingHeading: Locator;
  readonly monthlyComparisonHeading: Locator;

  // Budget alerts section
  readonly budgetAlertsHeading: Locator;

  // Recent transactions section
  readonly recentTransactionsHeading: Locator;
  readonly recentTransactionRows: Locator;

  // Overview heading
  readonly overviewHeading: Locator;

  constructor(private page: Page) {
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    this.totalSpentLabel    = page.getByText('Total Spent');
    this.monthlyIncomeLabel = page.getByText('Monthly Income');
    this.netSavingsLabel    = page.getByText('Net Savings');
    this.transactionsLabel  = page.getByText('Transactions');

    this.spendingByCategoryHeading  = page.getByText('Spending by Category');
    this.cumulativeSpendingHeading  = page.getByText('Cumulative Spending');
    this.monthlyComparisonHeading   = page.getByText('Monthly Comparison');

    this.budgetAlertsHeading        = page.getByText('Budget Alerts');
    this.recentTransactionsHeading  = page.getByText('Recent Transactions');

    // Each row has a red amount prefixed with "−$"
    this.recentTransactionRows = page.locator('text=/-\\$[\\d,]+(\\.\\d+)?/');

    this.overviewHeading = page.getByRole('heading', { name: 'Overview' });
  }

  /** Navigate to the dashboard via the sidebar Charts button. */
  async navigate() {
    await this.page.getByRole('button', { name: /charts/i }).click();
    await expect(this.overviewHeading).toBeVisible();
  }

  /** Click a month selector button and wait for the KPI section to stabilise. */
  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    const btn = this.page.getByRole('button', { name: month });
    await btn.click();
    // Brief wait for React state update; the active button gets emerald styling
    await expect(btn).toHaveClass(/text-emerald-400/);
  }

  /**
   * Read the dollar value displayed directly inside a KPI card.
   * Returns the raw text, e.g. "$4,812.37".
   */
  async getKpiValue(label: Locator): Promise<string> {
    const card = label.locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();
    // The bold value is a <p> with class text-xl
    return (await card.locator('p.text-xl').textContent()) ?? '';
  }

  /**
   * Read the subtitle text of a KPI card (the small coloured line below the value).
   */
  async getKpiSub(label: Locator): Promise<string> {
    const card = label.locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();
    return (await card.locator('p.text-xs').textContent()) ?? '';
  }
}
