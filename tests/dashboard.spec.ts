import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard — happy-path and negative tests
 *
 * User story: "As a user I can view my monthly financial overview on the
 * Dashboard, switch between January, February, and March, and see KPI
 * cards, charts, budget alerts, and recent transactions update accordingly."
 *
 * Happy-path tests (positive scenario): primary success flows.
 * Negative tests: guards against incorrect data, missing state, auth bypass.
 */

/* ─────────────────────────────────────────────────────────────────────
   HAPPY PATH
   ───────────────────────────────────────────────────────────────────── */

test.describe('Dashboard — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Charts is active by default after login
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('all 4 KPI cards are visible on the Dashboard after login', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await expect(dashboard.totalSpentCard).toBeVisible();
    await expect(dashboard.monthlyIncomeCard).toBeVisible();
    await expect(dashboard.netSavingsCard).toBeVisible();
    await expect(dashboard.transactionsCard).toBeVisible();
  });

  test('Monthly Income KPI always shows $6,500.00 (fixed seeded value)', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    const income = await dashboard.getKpiValue('Monthly Income');
    expect(income).toBe('$6,500.00');
  });

  test('switching to January changes the Total Spent KPI value', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Read the current (March, index 2) value
    const marSpent = await dashboard.getKpiValue('Total Spent');

    // Switch to January
    await dashboard.selectMonth('Jan');
    const janSpent = await dashboard.getKpiValue('Total Spent');

    // Seeded data is different per month
    expect(janSpent).not.toEqual(marSpent);
  });

  test('all 3 chart panels are visible: Spending by Category, Cumulative Spending, Monthly Comparison', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await expect(dashboard.spendingByCategoryHeading).toBeVisible();
    await expect(dashboard.cumulativeSpendingHeading).toBeVisible();
    await expect(dashboard.monthlyComparisonHeading).toBeVisible();
  });

  test('Recent Transactions panel is visible and shows at least one row', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await expect(dashboard.recentTransactionsHeading).toBeVisible();

    // At least one transaction description (any text) in the transactions list
    const rows = page.locator('div').filter({ hasText: /Housing|Food|Transport|Entertainment|Health|Utilities|Shopping|Subscriptions/ }).first();
    await expect(rows).toBeVisible();
  });

  test('Budget Alerts panel is visible (seeded spending exceeds 50% in at least 1 category)', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await expect(dashboard.budgetAlertsHeading).toBeVisible();
  });

  test('month selector buttons Jan, Feb, Mar are all visible on the Dashboard', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await expect(dashboard.janButton).toBeVisible();
    await expect(dashboard.febButton).toBeVisible();
    await expect(dashboard.marButton).toBeVisible();
  });

  test('Net Savings KPI is positive for the demo dataset in March', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Ensure we are on March (default)
    await dashboard.selectMonth('Mar');

    const savings = await dashboard.getKpiValue('Net Savings');
    // Savings = $6500 - totalSpent; with demo data this is always positive
    const numericValue = parseFloat(savings.replace(/[$,]/g, ''));
    expect(numericValue).toBeGreaterThan(0);
  });

  test('top bar displays "dashboard" as the page title after login', async ({ page }) => {
    await expect(page.locator('header h1')).toHaveText('dashboard');
  });
});

/* ─────────────────────────────────────────────────────────────────────
   NEGATIVE / EDGE-CASE TESTS
   ───────────────────────────────────────────────────────────────────── */

test.describe('Dashboard — negative and edge-case flows', () => {
  test('dashboard is not accessible without authentication (login screen is shown)', async ({ page }) => {
    // Navigate directly to the app root without logging in
    await page.goto('http://localhost:5173');

    // Should see the login screen, not the Dashboard
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Overview' })).not.toBeVisible();
  });

  test('Total Spent KPI is never negative for any of the 3 seeded months', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const dashboard = factory.dashboard();

    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await dashboard.selectMonth(month);
      const spent = await dashboard.getKpiValue('Total Spent');
      const numericValue = parseFloat(spent.replace(/[$,]/g, ''));
      expect(numericValue).toBeGreaterThanOrEqual(0);
    }
  });

  test('Transactions KPI count is a positive integer for each month', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const dashboard = factory.dashboard();

    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await dashboard.selectMonth(month);
      // The Transactions KPI card shows a raw number (not currency-formatted)
      const countText = await page
        .getByText('Transactions')
        .locator('..')
        .getByText(/^\d+$/)
        .first()
        .textContent();
      const count = parseInt(countText ?? '0', 10);
      expect(count).toBeGreaterThan(0);
    }
  });

  test('navigating away from Dashboard and back restores the Overview heading', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Go to Expenses
    await page.getByRole('button', { name: /expenses/i }).click();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();

    // Return to Charts (Dashboard)
    await page.getByRole('button', { name: /charts/i }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });
});
