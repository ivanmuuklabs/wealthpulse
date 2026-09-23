import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.describe('Dashboard — KPI cards and alerts', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we are on the Dashboard (Charts) view before each test
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // Test 1 — Switching months updates the Total Spent KPI value
  test('switching from January to February changes the Total Spent KPI', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Read Total Spent for January
    await dashboard.selectMonth('Jan');
    const janSpent = await page
      .getByText('Total Spent')
      .first()
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();

    // Switch to February and read again
    await dashboard.selectMonth('Feb');
    const febSpent = await page
      .getByText('Total Spent')
      .first()
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();

    // The seeded demo data has different spending per month
    expect(janSpent).not.toBeNull();
    expect(febSpent).not.toBeNull();
    expect(janSpent).not.toEqual(febSpent);

    // All four KPI card labels must still be present after the month switch
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });

  // Test 2 — Budget Alerts section is visible and shows at least one alert category
  test('Budget Alerts section is visible on the Dashboard with category entries', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // January has known over-50%-budget categories in the seeded data
    await dashboard.selectMonth('Jan');

    // The Budget Alerts heading (or card title) must be present
    await expect(dashboard.budgetAlertsSection).toBeVisible();

    // Each alert shows a "%" progress label — assert at least one is rendered
    const alertPercentages = page.locator('[class*="budget-alert"], section, div')
      .filter({ hasText: /Budget Alerts/ })
      .locator('text=/%/')
      .first();

    // Alternatively confirm at least one category icon+name pair appears under Alerts
    // The section always shows categories that exceeded 50% of their limit
    const alertItems = page
      .getByText('Budget Alerts')
      .locator('..')
      .locator('div')
      .filter({ hasText: /\d+%/ });

    await expect(alertItems.first()).toBeVisible();
  });
});
