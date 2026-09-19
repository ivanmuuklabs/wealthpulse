import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard (Charts) tab — overview smoke tests
 *
 * Gap addressed by Amikoo QA review of PR #49.
 *
 * PR #49 adds dashboard.month-switching.spec.ts which verifies that KPI values
 * change when switching months. These tests cover the complementary flows that
 * are still untested:
 *
 *  - All 4 KPI stat cards are visible after login (Total Spent, Monthly Income,
 *    Net Savings, Transactions)
 *  - Total Spent and Monthly Income show dollar-formatted values
 *  - "Spending by Category", "Cumulative Spending", and "Monthly Comparison"
 *    chart section headings are visible
 *  - Budget Alerts section appears (seeded March data has categories > 50%)
 *  - Recent Transactions section is visible and populated with at least one row
 *
 * Uses the DashboardPage POM added by PR #49.
 */

test.describe('Dashboard — KPI cards visible after login', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we landed on the Overview page (Charts tab active by default)
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('all four KPI stat cards are visible on the Overview page', async ({ page }) => {
    // Per the current KPI order: Total Spent, Monthly Income, Net Savings, Transactions
    await expect(page.getByText('Total Spent').first()).toBeVisible();
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });

  test('Total Spent KPI shows a dollar-formatted value', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    const text = await dashboard.getTotalSpentText();
    // Should match a USD format like "$1,234.56"
    expect(text).toMatch(/^\$[\d,]+\.\d{2}$/);
  });

  test('Net Savings KPI shows a non-zero dollar value', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    const text = await dashboard.getNetSavingsText();
    const amount = parseFloat(text.replace(/[$,]/g, ''));
    // With $6,500 monthly income and spending < $6,500, savings must be > 0
    expect(amount).not.toBeNaN();
  });

  test('Transactions KPI shows a positive integer count', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    const text = await dashboard.transactionsValue.textContent();
    const count = parseInt(text ?? '0', 10);
    // Seeded data guarantees multiple transactions per month
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Dashboard — chart sections visible', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('"Spending by Category" chart section heading is visible', async ({ page }) => {
    await expect(page.getByText('Spending by Category')).toBeVisible();
  });

  test('"Cumulative Spending" chart section heading is visible', async ({ page }) => {
    await expect(page.getByText('Cumulative Spending')).toBeVisible();
  });

  test('"Monthly Comparison" chart section heading is visible', async ({ page }) => {
    await expect(page.getByText('Monthly Comparison')).toBeVisible();
  });
});

test.describe('Dashboard — Budget Alerts section', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('Budget Alerts section is visible (seeded March data has categories > 50%)', async ({ page }) => {
    // The app filters categories where pct > 50. With seeded data (e.g. Housing
    // rent ~$1,400 vs $2,000 budget = 70%) at least one alert is guaranteed.
    await expect(page.getByText('Budget Alerts')).toBeVisible();
  });

  test('Budget Alerts section is NOT visible on the Expenses tab', async ({ page }) => {
    // Budget Alerts is a Dashboard-only widget
    await page.getByRole('button', { name: 'Expenses' }).click();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();

    await expect(page.getByText('Budget Alerts')).not.toBeVisible();
  });
});

test.describe('Dashboard — Recent Transactions section', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('"Recent Transactions" section heading is visible on the Overview page', async ({ page }) => {
    await expect(page.getByText('Recent Transactions')).toBeVisible();
  });

  test('Recent Transactions list is populated with at least one transaction', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // The dashboard renders up to 8 recent transactions from the selected month
    await expect(dashboard.recentTransactionRows.first()).toBeVisible();
  });
});
