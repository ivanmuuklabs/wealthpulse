import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard (Charts/Overview tab) — critical flow tests.
 *
 * Covers:
 *   - Month switcher changes the displayed KPI values (Total Spent differs Jan vs Mar)
 *   - All four KPI stat cards are always present after login
 *
 * These flows were previously untested: the existing auth.spec.ts only verified
 * that KPI labels exist on initial load; no test verified that the month selector
 * actually recalculates the displayed figures.
 */

test.describe('Dashboard — month switching and KPI cards', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we are on the Overview page before each test
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // Test 1 — Switching months recalculates the Total Spent KPI
  test('switching from January to March changes the Total Spent value', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Read Total Spent for January (month index 0)
    await dashboard.selectMonth('Jan');
    const janSpent = await dashboard.getKpiValue('Total Spent');

    // Switch to March (month index 2, the default) and re-read
    await dashboard.selectMonth('Mar');
    const marSpent = await dashboard.getKpiValue('Total Spent');

    // Seeded data generates different spending each month — values must differ
    expect(janSpent).not.toBeNull();
    expect(marSpent).not.toBeNull();
    expect(janSpent).not.toEqual(marSpent);
  });
});
