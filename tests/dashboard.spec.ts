import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard module tests — covers two previously untested critical flows:
 *  1. Month switching: all KPI values update when a different month is selected.
 *  2. Recent Transactions: the section is visible and contains rows for the selected month.
 */
test.describe('Dashboard — month switching and recent transactions', () => {

  test.beforeEach(async ({ page }) => {
    // Log in once before each test in this suite
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
  });

  /**
   * Test 1 — Month switching updates KPI values.
   *
   * The dashboard month selector drives all four KPI cards.
   * Monthly Income is fixed at $6,500 but Total Spent should differ between months
   * because the seeded transaction data varies per month.
   */
  test('switching from January to March shows different Total Spent values', async ({ page }) => {
    const factory = new PageFactory(page);
    const dashboard = factory.dashboard();

    // Start on January
    await dashboard.selectMonth('Jan');
    const janSpent = await dashboard.readKpiAmount('Total Spent');

    // Switch to March
    await dashboard.selectMonth('Mar');
    const marSpent = await dashboard.readKpiAmount('Total Spent');

    // Seeded data guarantees January and March have different spending totals
    expect(janSpent).not.toBeNull();
    expect(marSpent).not.toBeNull();
    expect(janSpent).not.toEqual(marSpent);
  });

  /**
   * Test 2 — Recent Transactions section is visible and populated.
   *
   * After login the dashboard shows "Recent Transactions" with up to 8 rows
   * for the active month. This verifies the section renders and has data.
   */
  test('Recent Transactions section is visible and contains at least one row', async ({ page }) => {
    const factory = new PageFactory(page);

    // The section heading must be visible
    await expect(page.getByText('Recent Transactions')).toBeVisible();

    // At least one transaction row should be visible (amounts are always negative red values)
    // Each row contains an amount displayed as a dollar value
    const firstAmount = page.locator('text=/^-\\$[\\d,]+\\.\\d{2}$/').first();
    await expect(firstAmount).toBeVisible();
  });

});
