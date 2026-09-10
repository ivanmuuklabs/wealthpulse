import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard (Charts) module tests.
 *
 * Coverage gaps addressed:
 *   1. Month switching — verifying the KPI cards update when the user switches
 *      between Jan / Feb / Mar in the month selector.
 *
 * The app seeds different spending per month, so the "Total Spent" value
 * must differ between at least two months.
 */

test.describe('Dashboard — month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we land on the Overview page
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // Test 1 of 5 — switching month updates the displayed KPI values
  test('switching from March to January updates the Total Spent KPI', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Default selected month is March (index 2); read its Total Spent value
    const marValue = await dashboard.getKpiValue('Total Spent');
    expect(marValue).toBeTruthy();

    // Switch to January
    await dashboard.selectMonth(0);

    // Wait for the heading to stay (page doesn't reload, just re-renders)
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // The Jan Total Spent must be visible and different from March
    const janValue = await dashboard.getKpiValue('Total Spent');
    expect(janValue).toBeTruthy();

    // Seeded data guarantees Jan ≠ Mar
    expect(janValue).not.toEqual(marValue);

    // The header sub-text must now reflect "January 2026"
    await expect(page.locator('header p').filter({ hasText: 'January 2026' })).toBeVisible();
  });
});
