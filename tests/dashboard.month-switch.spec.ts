import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Test 1 — Dashboard month switching
 *
 * Coverage gap: No existing test verifies that the dashboard KPI values
 * actually change when the user switches between months (Jan / Feb / Mar).
 * The app stores selectedMonth in global state and re-computes all KPIs;
 * this test pins that behaviour.
 */
test.describe('Dashboard — month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we are on the dashboard
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('switching from Jan to Mar changes the Total Spent KPI value', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Read Total Spent for January
    await dashboard.selectMonth('Jan');
    const janSpent = await page
      .getByText('Total Spent')
      .locator('..')
      .locator('p.text-xl')
      .first()
      .textContent();

    // Switch to March and read again
    await dashboard.selectMonth('Mar');
    const marSpent = await page
      .getByText('Total Spent')
      .locator('..')
      .locator('p.text-xl')
      .first()
      .textContent();

    // Seeded data produces different spending each month
    expect(janSpent).not.toEqual(marSpent);
  });

  test('all four KPI cards are visible on the dashboard for each month', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await dashboard.selectMonth(month);

      // All 4 KPI cards must be present regardless of month
      await expect(dashboard.kpiMonthlyIncome).toBeVisible();
      await expect(dashboard.kpiTotalSpent).toBeVisible();
      await expect(dashboard.kpiNetSavings).toBeVisible();
      await expect(dashboard.kpiTransactions).toBeVisible();
    }
  });
});
