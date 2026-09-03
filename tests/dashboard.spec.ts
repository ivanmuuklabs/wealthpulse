import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Confirm the dashboard (Charts) view is loaded
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // Test 3 — Switching the month selector updates the Total Spent KPI
  test('switching from January to February updates the Total Spent KPI value', async ({ page }) => {
    const dashboardPage = new PageFactory(page).dashboard();

    // Read Total Spent for January (default month on load)
    await dashboardPage.selectMonth('Jan');
    const janSpent = await dashboardPage.getKpiValue('Total Spent');

    // Switch to February and read again
    await dashboardPage.selectMonth('Feb');
    const febSpent = await dashboardPage.getKpiValue('Total Spent');

    // Monthly Income is fixed at $6,500 but Total Spent varies — the values must differ
    expect(janSpent).not.toBeNull();
    expect(febSpent).not.toBeNull();
    expect(janSpent).not.toEqual(febSpent);

    // All four KPI cards must remain visible after the switch
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });
});
