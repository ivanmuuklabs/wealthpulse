import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard (Charts tab) tests.
 *
 * Coverage gap addressed:
 *   The existing auth.spec.ts confirms the page loads and KPI labels exist,
 *   but no test verifies that switching months actually changes the KPI values —
 *   a critical correctness check for the month-selector feature.
 */

test.describe('Dashboard — month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we are on the dashboard before each test
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  /**
   * Test 1 — Switching months updates the KPI "Total Spent" value.
   *
   * The app seeds different transaction amounts for January, February and March,
   * so the Total Spent card must reflect a different dollar value for each month.
   * This pins the month-selector's reactivity and the KPI recalculation logic.
   */
  test('switching from March to January updates the Total Spent KPI', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // The app opens on March (selectedMonth = 2) by default.
    // Read the current Total Spent value for March.
    const marchValue = await page
      .getByText('Total Spent')
      .locator('..')
      .locator('p.text-xl')
      .first()
      .textContent();

    // Switch to January
    await dashboard.selectMonth('Jan');

    // The heading must remain visible — we haven't navigated away
    await expect(dashboard.overviewHeading).toBeVisible();

    // The Total Spent value must be visible and different from March
    const janValue = await page
      .getByText('Total Spent')
      .locator('..')
      .locator('p.text-xl')
      .first()
      .textContent();

    expect(janValue).not.toBeNull();
    expect(marchValue).not.toBeNull();
    // Different months have different seeded spending totals
    expect(janValue).not.toEqual(marchValue);

    // All four KPI label cards must still be visible after the switch
    await expect(dashboard.totalSpentLabel).toBeVisible();
    await expect(dashboard.monthlyIncomeLabel).toBeVisible();
    await expect(dashboard.netSavingsLabel).toBeVisible();
    await expect(dashboard.transactionsLabel).toBeVisible();
  });
});
