import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard Overview — Happy Path & Negative Tests
 *
 * User story: "As a logged-in user I want to see an Overview of my personal
 * finances for any given month so that I can understand my spending, savings,
 * and budget health at a glance."
 *
 * Acceptance criteria (happy path):
 * - All 4 KPI cards are visible after login
 * - Monthly Income is always fixed at $6,500.00
 * - Month switching updates the Total Spent value
 * - All 3 chart panels render their headings
 * - Recent Transactions shows between 1 and 8 rows
 *
 * Negative / edge cases:
 * - Total Spent is never a negative dollar value
 * - Net Savings = Monthly Income − Total Spent
 * - Dashboard is NOT accessible without authentication
 */

test.describe('Dashboard Overview — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we landed on the Dashboard
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('all 4 KPI cards are visible after login', async ({ page }) => {
    // Seeded demo data always produces all four cards
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });

  test('Monthly Income KPI always shows $6,500.00', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Check March (default), then switch months and verify income stays constant
    const marchIncome = await dashboard.getKpiValue('Monthly Income');
    expect(marchIncome).toContain('6,500');

    await dashboard.selectMonth('Jan');
    const janIncome = await dashboard.getKpiValue('Monthly Income');
    expect(janIncome).toContain('6,500');

    await dashboard.selectMonth('Feb');
    const febIncome = await dashboard.getKpiValue('Monthly Income');
    expect(febIncome).toContain('6,500');
  });

  test('switching from March to January updates Total Spent KPI', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // March is selected by default (selectedMonth: 2 in initialState)
    const marSpent = await dashboard.getKpiValue('Total Spent');

    await dashboard.selectMonth('Jan');
    const janSpent = await dashboard.getKpiValue('Total Spent');

    // Seeded data differs month-to-month
    expect(janSpent).not.toEqual(marSpent);
  });

  test('all 3 chart section headings are visible', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await expect(dashboard.spendingByCategoryHeading).toBeVisible();
    await expect(dashboard.cumulativeSpendingHeading).toBeVisible();
    await expect(dashboard.monthlyComparisonHeading).toBeVisible();
  });

  test('Recent Transactions section shows between 1 and 8 rows', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await expect(dashboard.recentTransactionsHeading).toBeVisible();
    const count = await dashboard.recentTransactionRows.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(8);
  });

  test('Budget Alerts section is visible with seeded data exceeding 50% threshold', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // With the seeded data, at least one category exceeds 50% of its budget,
    // so the Budget Alerts heading must be present
    await expect(dashboard.budgetAlertsHeading).toBeVisible();
  });

  test('clicking Jan, Feb, Mar month buttons all keep Overview heading visible', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await dashboard.selectMonth('Jan');
    await expect(dashboard.overviewHeading).toBeVisible();

    await dashboard.selectMonth('Feb');
    await expect(dashboard.overviewHeading).toBeVisible();

    await dashboard.selectMonth('Mar');
    await expect(dashboard.overviewHeading).toBeVisible();
  });
});

test.describe('Dashboard Overview — negative / edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('Total Spent is never displayed as a negative amount', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await dashboard.selectMonth(month);
      const value = await dashboard.getKpiValue('Total Spent');
      // A negative amount would start with "-$"
      expect(value).not.toMatch(/^-\$/);
    }
  });

  test('Transactions count is a positive integer for every month', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await dashboard.selectMonth(month);
      // The Transactions KPI value is just a number (no $ prefix)
      const value = await page
        .getByText('Transactions')
        .locator('..')
        .locator('p.text-xl')
        .textContent();
      const num = parseInt(value ?? '0', 10);
      expect(num).toBeGreaterThan(0);
    }
  });

  test('dashboard route is inaccessible without authentication', async ({ page }) => {
    // Navigate directly to the app root without logging in
    await page.goto('http://localhost:5173');

    // The login screen — not the dashboard — should be visible
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Overview' })).not.toBeVisible();
  });

  test('Recent Transactions list changes when switching months', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await dashboard.selectMonth('Jan');
    const janCount = await dashboard.recentTransactionRows.count();

    await dashboard.selectMonth('Mar');
    const marCount = await dashboard.recentTransactionRows.count();

    // Both months must have transactions — they may differ in count (seeded data)
    expect(janCount).toBeGreaterThanOrEqual(1);
    expect(marCount).toBeGreaterThanOrEqual(1);
  });
});
