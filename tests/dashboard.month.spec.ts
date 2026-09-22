import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard — month switching
 *
 * Covers the critical flow where a user changes the selected month on the
 * dashboard and expects the KPI cards to reflect different spending totals.
 * The app seeds deterministic data for Jan / Feb / Mar 2026, so the values
 * must differ across months.
 */
test.describe('Dashboard — month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Ensure we land on the Overview page before each test
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // Test 1 — switching months changes the Total Spent KPI value
  test('switching from March to January updates the Total Spent KPI', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // App defaults to March (index 2). Read its Total Spent value.
    const marValue = await dashboard.getKpiValue('Total Spent');

    // Switch to January and read the new value.
    await dashboard.selectMonth('Jan');
    const janValue = await dashboard.getKpiValue('Total Spent');

    // The seeded data produces different totals per month.
    expect(janValue).not.toBeNull();
    expect(marValue).not.toBeNull();
    expect(janValue).not.toEqual(marValue);

    // Also confirm the top-bar sub-text now shows the new month name.
    await expect(page.locator('header p').first()).toHaveText('January 2026');
  });
});
