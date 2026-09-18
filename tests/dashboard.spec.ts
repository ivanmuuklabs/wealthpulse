import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard (Charts tab) — month selector & KPI coverage
 *
 * Gaps addressed:
 *   1. Switching months on the Dashboard updates the KPI values
 *   2. The Recent Transactions list shows at least one transaction row
 */

test.describe('Dashboard — month switching and KPIs', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // The app lands on the Charts (Dashboard) tab by default after login
  });

  // Test 1 — KPI values differ between January and March
  // Verifies that the month selector actually filters transactions used for KPIs.
  test('switching from March to January changes the Total Spent KPI', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Read Total Spent for March (default selected month = 2 = March)
    await dashboard.selectMonth('Mar');
    const marSpent = await dashboard.getKpiValue('Total Spent');

    // Switch to January and read again
    await dashboard.selectMonth('Jan');
    const janSpent = await dashboard.getKpiValue('Total Spent');

    // The seeded data produces different spending each month
    expect(marSpent).not.toBeNull();
    expect(janSpent).not.toBeNull();
    expect(janSpent).not.toEqual(marSpent);
  });

  // Test 2 — Recent Transactions section is populated after login
  // Verifies the dashboard renders actual transaction rows (not an empty list).
  test('Recent Transactions list is visible and contains at least one entry', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // The section heading must be present
    await expect(page.getByText('Recent Transactions')).toBeVisible();

    // At least one transaction row: each row contains a category + date label
    const firstRow = page
      .locator('div.flex.items-center.gap-3.py-2')
      .filter({ hasText: /·/ }) // rows contain "<category> · <date>"
      .first();

    await expect(firstRow).toBeVisible();
  });

});
