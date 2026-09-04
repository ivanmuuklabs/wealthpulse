import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard (Charts) tab — functional coverage tests.
 *
 * Covers two critical flows not yet tested:
 *  1. Switching between months (Jan / Feb / Mar) updates the KPI cards.
 *  2. The "Recent Transactions" list is visible and non-empty for the
 *     currently selected month.
 *
 * The app seeds deterministic data for Jan, Feb, and Mar 2026.
 * The initial selected month is March (index 2), so Jan and Feb always
 * produce different KPI values from the default view.
 */

test.describe('Dashboard — month switching and KPI display', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Wait for the dashboard to be fully rendered before each test
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // Test 1 — Switching from March to January changes the "Total Spent" KPI value
  test('switching from March to January shows a different Total Spent KPI', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Default month is March — capture its "Total Spent" value
    const marchSpentEl = page
      .getByText('Total Spent')
      .first()
      .locator('..')
      .locator('p.text-xl')
      .first();
    const marchValue = await marchSpentEl.textContent();

    // Switch to January
    await dashboard.selectMonth('Jan');

    // The KPI should now show a different figure (seeded data differs per month)
    const janValue = await marchSpentEl.textContent();
    expect(janValue).not.toEqual(marchValue);

    // Sanity: the KPI label is still visible after the switch
    await expect(dashboard.totalSpentLabel).toBeVisible();
  });

  // Test 2 — The Recent Transactions section renders entries for the selected month
  test('Recent Transactions list is non-empty for each available month', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await dashboard.selectMonth(month);

      // The section heading must be present
      await expect(dashboard.recentTransactionsSection).toBeVisible();

      // At least one transaction row should appear (the app shows up to 8)
      // Each row contains a dollar amount with a leading minus sign
      const rows = page.locator('div').filter({ hasText: /^-\$[\d,]+\.?\d*$/ });
      await expect(rows.first()).toBeVisible();
    }
  });
});
