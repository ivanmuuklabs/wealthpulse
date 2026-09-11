import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests for the Dashboard (Charts) tab.
 *
 * The dashboard shows four KPI cards (Total Spent, Monthly Income,
 * Net Savings, Transactions) for the selected month. Switching months
 * must update the spending-dependent KPIs while leaving the fixed
 * Monthly Income unchanged.
 *
 * Coverage gap addressed: Dashboard month-switching and KPI card recalculation
 * were not tested by any existing spec.
 */

test.describe('Dashboard — month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we are on the dashboard before each test
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('switching from January to February updates Total Spent and Net Savings KPIs', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Read KPIs for January (month index 0)
    await dashboard.selectMonth('Jan');

    const janSpent = await page
      .getByText('Total Spent')
      .first()
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();

    const janSavings = await page
      .getByText('Net Savings')
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();

    // Switch to February (month index 1)
    await dashboard.selectMonth('Feb');

    const febSpent = await page
      .getByText('Total Spent')
      .first()
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();

    const febSavings = await page
      .getByText('Net Savings')
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();

    // Seeded data produces different spending per month — values must change
    expect(janSpent).not.toEqual(febSpent);
    expect(janSavings).not.toEqual(febSavings);

    // Monthly Income is fixed at $6,500 regardless of month — must not change
    const monthlyIncome = await page
      .getByText('Monthly Income')
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();
    expect(monthlyIncome).toMatch(/\$6,500/);
  });
});
