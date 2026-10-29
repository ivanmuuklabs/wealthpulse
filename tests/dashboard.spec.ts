import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard — happy path tests
 *
 * The Dashboard (Charts) tab is the default view after login. It shows:
 *   - A month selector (Jan / Feb / Mar)
 *   - Four KPI stat cards: Total Spent, Monthly Income, Net Savings, Transactions
 *   - A Spending-by-Category donut chart, Cumulative Spending area chart, Monthly Comparison bar chart
 *   - A Budget Alerts card (when spending > 50% of budget in a category)
 *   - A Recent Transactions list
 *
 * These tests validate the core reactive behaviour: month switching updates KPIs,
 * static cards are always visible, and sections that depend on data appear correctly.
 */

test.describe('Dashboard — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Dashboard is the default tab after login — navigate explicitly for clarity
    await factory.dashboard().navigate();
  });

  test('Overview heading and all four KPI cards are visible after login', async ({ page }) => {
    await expect(page.getByText('Overview')).toBeVisible();

    const dashboard = new PageFactory(page).dashboard();
    await expect(dashboard.totalSpentCard).toBeVisible();
    await expect(dashboard.monthlyIncomeCard).toBeVisible();
    await expect(dashboard.netSavingsCard).toBeVisible();
    await expect(dashboard.transactionsCard).toBeVisible();
  });

  test('Monthly Income KPI always shows $6,500.00 regardless of selected month', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await dashboard.selectMonth(month);
      const income = await dashboard.getKpiValue(dashboard.monthlyIncomeCard);
      expect(income).toContain('6,500');
    }
  });

  test('switching the month selector changes the Total Spent KPI value', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await dashboard.selectMonth('Jan');
    const janSpent = await dashboard.getKpiValue(dashboard.totalSpentCard);

    await dashboard.selectMonth('Mar');
    const marSpent = await dashboard.getKpiValue(dashboard.totalSpentCard);

    // Seeded data generates different spending each month
    expect(janSpent).not.toEqual(marSpent);
    // Both must look like dollar amounts
    expect(janSpent).toMatch(/\$[\d,]+/);
    expect(marSpent).toMatch(/\$[\d,]+/);
  });

  test('Net Savings KPI equals Monthly Income minus Total Spent for each month', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    const parseAmt = (s: string) => parseFloat(s.replace(/[$,]/g, ''));

    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await dashboard.selectMonth(month);
      const income    = parseAmt(await dashboard.getKpiValue(dashboard.monthlyIncomeCard));
      const spent     = parseAmt(await dashboard.getKpiValue(dashboard.totalSpentCard));
      const savings   = parseAmt(await dashboard.getKpiValue(dashboard.netSavingsCard));

      // Allow $1 rounding tolerance
      expect(Math.abs(savings - (income - spent))).toBeLessThanOrEqual(1);
    }
  });

  test('Transactions KPI shows a positive count for March (default month)', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await dashboard.selectMonth('Mar');

    const txnCard = dashboard.transactionsCard;
    const cardText = await txnCard.textContent();
    // The count appears as a plain number (e.g. "18")
    const match = cardText?.match(/\d+/);
    expect(match).not.toBeNull();
    expect(parseInt(match![0])).toBeGreaterThan(0);
  });

  test('Budget Alerts section is visible for February and lists category names', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // February seeded data reliably exceeds 50% budget in at least one category
    await dashboard.selectMonth('Feb');

    await expect(dashboard.budgetAlertsSection).toBeVisible();

    // The section should contain at least one known category name
    const sectionText = await dashboard.budgetAlertsSection.textContent();
    const knownCategories = ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Shopping', 'Subscriptions'];
    const hasCategoryName = knownCategories.some(cat => sectionText?.includes(cat));
    expect(hasCategoryName).toBe(true);
  });

  test('Recent Transactions section shows up to 8 rows with amount formatted as -$X', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await dashboard.selectMonth('Mar');

    await expect(dashboard.recentTransactionsSection).toBeVisible();

    // Each recent-transaction row renders "-$XX.XX" in red
    const amounts = page.locator('text=/-\\$[\\d,.]+/');
    const count = await amounts.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(8);
  });

  test('Spending by Category donut chart is rendered on the page', async ({ page }) => {
    await expect(page.getByText('Spending by Category')).toBeVisible();
    // The PieChart renders SVG elements — verify at least one arc/path exists
    const svg = page.locator('.recharts-pie');
    await expect(svg.first()).toBeVisible();
  });

  test('Monthly Comparison chart section is visible', async ({ page }) => {
    await expect(page.getByText('Monthly Comparison')).toBeVisible();
    // Bar chart SVG path elements confirm it rendered
    const barChart = page.locator('.recharts-bar');
    await expect(barChart.first()).toBeVisible();
  });
});
