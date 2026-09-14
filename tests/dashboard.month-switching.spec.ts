import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Test 1 — Dashboard month switching
 *
 * Gap addressed: The existing auth.spec.ts only checks that the dashboard loads
 * for March (selectedMonth = 2). No test validates that the Jan / Feb / Mar
 * month buttons actually change the data shown in the KPI cards.
 *
 * This test pins that switching months produces different "Total Spent" values,
 * confirming the month-filter data pipeline works end-to-end.
 */
test.describe('Dashboard — month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we are on the Dashboard
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('switching from March to January changes the Total Spent KPI value', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Read Total Spent on the default month (March, index 2)
    await dashboard.selectMonth('Mar');
    const marSpent = await dashboard.getKpiValue('Total Spent');

    // Switch to January and re-read
    await dashboard.selectMonth('Jan');
    const janSpent = await dashboard.getKpiValue('Total Spent');

    // The seeded data generates different spending per month
    expect(janSpent).not.toBeNull();
    expect(marSpent).not.toBeNull();
    expect(janSpent).not.toEqual(marSpent);

    // The KPI card must still be visible after the switch
    await expect(dashboard.totalSpentCard).toBeVisible();
    await expect(dashboard.monthlyIncomeCard).toBeVisible();
    await expect(dashboard.netSavingsCard).toBeVisible();
    await expect(dashboard.transactionsCard).toBeVisible();
  });
});
