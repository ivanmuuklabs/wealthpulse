import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard — month switching
 *
 * Coverage gap: the Charts (Overview) tab month picker had no tests verifying
 * that KPI values actually change when the user selects a different month.
 * The seeded data generates distinct spending for Jan/Feb/Mar, so the
 * "Total Spent" KPI must differ between at least two months.
 */
test.describe('Dashboard — month switching updates KPI values', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we are on the Overview (Charts) page before each test
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('switching from Jan to Mar changes the Total Spent KPI on the Dashboard', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Read Total Spent for January (index 0)
    await dashboard.selectMonth(0);
    const janSpent = await dashboard.getKpiValue('Total Spent');

    // Switch to March (index 2) and read again
    await dashboard.selectMonth(2);
    const marSpent = await dashboard.getKpiValue('Total Spent');

    // Seeded data must produce different monthly totals
    expect(janSpent).not.toBeNull();
    expect(marSpent).not.toBeNull();
    expect(janSpent).not.toEqual(marSpent);

    // Monthly Income is a constant — it should NOT change when switching months
    const incomeAfterSwitch = await dashboard.getKpiValue('Monthly Income');
    expect(incomeAfterSwitch).toMatch(/\$6,500/);
  });
});
