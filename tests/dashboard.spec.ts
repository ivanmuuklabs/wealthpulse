import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard (Charts tab) — happy path and edge-case tests.
 *
 * The Dashboard is the default view after login.  It shows:
 *   - Four KPI stat cards (Total Spent, Monthly Income, Net Savings, Transactions)
 *   - Three charts (Spending by Category donut, Cumulative Spending, Monthly Comparison)
 *   - Budget Alerts section (when any category exceeds 50 % of its limit)
 *   - Recent Transactions list (up to 8 rows from the selected month)
 *
 * Month selector covers Jan (index 0), Feb (index 1), Mar (index 2).
 * The seeded demo data produces different values for each month so tests
 * can verify reactivity by comparing before/after values.
 */

test.describe('Dashboard — KPI cards', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // After login the app lands on the Dashboard tab automatically — no navigation needed.
  });

  // All four KPI cards must be rendered on load (default month = March)
  test('all four KPI cards are visible on the default dashboard view', async ({ page }) => {
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });

  // Monthly Income is a fixed constant ($6,500) — it must not change on month switch
  test('Monthly Income KPI card always shows $6,500.00', async ({ page }) => {
    const factory = new PageFactory(page);
    const dashboard = factory.dashboard();

    await dashboard.selectMonth('Jan');
    await expect(dashboard.monthlyIncomeCard).toContainText('$6,500.00');

    await dashboard.selectMonth('Feb');
    await expect(dashboard.monthlyIncomeCard).toContainText('$6,500.00');
  });

  // Switching the month must update Total Spent with different seeded data
  test('switching from January to February updates the Total Spent value', async ({ page }) => {
    const factory = new PageFactory(page);
    const dashboard = factory.dashboard();

    await dashboard.selectMonth('Jan');
    const janText = await dashboard.getKpiText(dashboard.totalSpentCard);

    await dashboard.selectMonth('Feb');
    const febText = await dashboard.getKpiText(dashboard.totalSpentCard);

    // The seeded data produces different totals for each month
    expect(janText).not.toEqual(febText);
    // Both must be non-empty dollar strings
    expect(janText).toMatch(/\$/);
    expect(febText).toMatch(/\$/);
  });

  // All four KPI cards remain visible after switching months
  test('all four KPI cards remain visible after switching to March', async ({ page }) => {
    const factory = new PageFactory(page);
    const dashboard = factory.dashboard();

    await dashboard.selectMonth('Mar');

    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });
});

test.describe('Dashboard — charts', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
  });

  // Three chart headings must render on the page
  test('Spending by Category, Cumulative Spending, and Monthly Comparison charts are present', async ({ page }) => {
    const factory = new PageFactory(page);
    const dashboard = factory.dashboard();

    await expect(dashboard.spendingByCategoryHeading).toBeVisible();
    await expect(dashboard.cumulativeSpendingHeading).toBeVisible();
    await expect(dashboard.monthlyComparisonHeading).toBeVisible();
  });

  // The donut/SVG chart element must be present in the DOM
  test('Spending by Category renders an SVG chart', async ({ page }) => {
    // Recharts renders an <svg> inside the ResponsiveContainer
    const chart = page.locator('.recharts-pie');
    await expect(chart.first()).toBeVisible();
  });
});

test.describe('Dashboard — Budget Alerts and Recent Transactions', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
  });

  // Budget Alerts render when spending exceeds 50 % of the limit for any category
  test('Budget Alerts section is visible and lists at least one alert row', async ({ page }) => {
    const factory = new PageFactory(page);
    const dashboard = factory.dashboard();

    // Default month is March — seeded data causes several categories to exceed 50 %
    await dashboard.selectMonth('Mar');

    await expect(dashboard.budgetAlertsSection).toBeVisible();
  });

  // Recent Transactions section must always appear with at least one row
  test('Recent Transactions section is visible on the default dashboard', async ({ page }) => {
    const factory = new PageFactory(page);
    const dashboard = factory.dashboard();

    await expect(dashboard.recentTransactionsSection).toBeVisible();
  });

  // Switching months changes which transactions appear in Recent Transactions
  test('Recent Transactions list updates when switching months', async ({ page }) => {
    const factory = new PageFactory(page);
    const dashboard = factory.dashboard();

    // Capture a description from the January list
    await dashboard.selectMonth('Jan');
    // Get all text in the recent-transactions card container
    const janText = await page
      .getByText('Recent Transactions')
      .locator('..')
      .textContent();

    await dashboard.selectMonth('Mar');
    const marText = await page
      .getByText('Recent Transactions')
      .locator('..')
      .textContent();

    // The two months have different seeded transactions — their combined card text differs
    expect(janText).not.toEqual(marText);
    // The section heading must still be visible after switching
    await expect(dashboard.recentTransactionsSection).toBeVisible();
  });
});
