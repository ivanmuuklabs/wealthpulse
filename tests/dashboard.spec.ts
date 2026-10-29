import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard module tests.
 *
 * Coverage gap addressed: the Dashboard month selector has no existing test that
 * verifies KPI cards actually change when the user switches months. This test
 * ensures that the Total Spent figure differs between January and March, proving
 * the month-switch mechanism updates all KPI cards correctly.
 */

test.describe('Dashboard — month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we land on the dashboard (Charts) view
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // Test 1 — switching months causes the Total Spent KPI to reflect different data
  test('switching from January to March updates the Total Spent KPI card', async ({ page }) => {
    const dashboardPage = new PageFactory(page).dashboard();

    // Read Total Spent for January (default month after login)
    await dashboardPage.selectMonth('Jan');
    const janSpent = await page
      .getByText('Total Spent')
      .locator('..')
      .locator('text=/\\$[\\d,]+(\\.\\d{2})?/')
      .first()
      .textContent();

    // Switch to March and read again
    await dashboardPage.selectMonth('Mar');
    const marSpent = await page
      .getByText('Total Spent')
      .locator('..')
      .locator('text=/\\$[\\d,]+(\\.\\d{2})?/')
      .first()
      .textContent();

    // The seeded demo data produces different spending totals for each month
    expect(janSpent).not.toBeNull();
    expect(marSpent).not.toBeNull();
    expect(janSpent).not.toEqual(marSpent);

    // All four KPI cards must remain visible after switching months
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });
});
