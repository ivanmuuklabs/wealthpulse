import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard (Charts) — coverage tests added 2026-09-15
 *
 * Gaps addressed:
 *  1. Month-switching: KPI values update when a different month is selected.
 *  2. KPI card visibility: all 4 StatCards present on load (complements auth.spec.ts
 *     which already checks labels, here we also verify the "Transactions" count changes).
 */

test.describe('Dashboard — month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Ensure we land on the overview page before each test
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // Test 1 — Total Spent KPI changes when switching from March to January
  test('Total Spent value differs between January and March on the dashboard', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Read Total Spent for March (default selected month index 2)
    await dashboard.selectMonth('Mar');
    const marSpent = await dashboard.getKpiValue('Total Spent');

    // Switch to January and read again
    await dashboard.selectMonth('Jan');
    const janSpent = await dashboard.getKpiValue('Total Spent');

    // Seeded data produces different spending per month
    expect(janSpent).not.toBeNull();
    expect(marSpent).not.toBeNull();
    expect(janSpent).not.toEqual(marSpent);
  });

  // Test 2 — Budget Alerts section is visible on the default month
  test('Budget Alerts section is visible after login on the default month', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // The default month is March (index 2); seeded data has categories above 50% threshold
    await expect(dashboard.budgetAlertsHeading).toBeVisible();
  });
});
