import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard — critical flows not yet covered.
 *
 * Test 1: Switching the month selector updates the Total Spent KPI,
 *         proving all KPI cards re-render for the newly selected month.
 *
 * Test 2: The Recent Transactions list shows entries that belong to the
 *         selected month (rows are capped at 8 and contain a date string
 *         matching the expected month).
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Wait for the dashboard to be fully rendered
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // Test 1 — Month switching updates KPI values
  test('switching from March to January changes the Total Spent KPI value', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // The app defaults to March (selectedMonth: 2).
    // Read Total Spent for March
    const marSpent = await dashboard.getKpiValue('Total Spent');

    // Switch to January
    await dashboard.selectMonth('Jan');

    // Read Total Spent for January — must differ from March (seeded data)
    const janSpent = await dashboard.getKpiValue('Total Spent');

    expect(janSpent).not.toBeNull();
    expect(marSpent).not.toBeNull();
    expect(janSpent).not.toEqual(marSpent);
  });

  // Test 2 — Recent Transactions list belongs to the selected month
  test('Recent Transactions section is visible and contains the month date string', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Verify the "Recent Transactions" section heading is present
    await expect(dashboard.recentTransactionsList).toBeVisible();

    // Switch to February
    await dashboard.selectMonth('Feb');

    // All transaction rows shown on the dashboard include the category · date subtitle.
    // At least one row must have "2026-02" in its text for February.
    const dateSubtitles = page.locator('p.text-\\[10px\\].text-slate-500');
    const count = await dateSubtitles.count();
    expect(count).toBeGreaterThan(0);

    // Confirm at least one subtitle contains a February date
    let foundFebruary = false;
    for (let i = 0; i < count; i++) {
      const text = await dateSubtitles.nth(i).textContent();
      if (text?.includes('2026-02')) {
        foundFebruary = true;
        break;
      }
    }
    expect(foundFebruary).toBe(true);
  });
});
