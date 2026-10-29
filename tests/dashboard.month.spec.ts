import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

// Test 1 — Dashboard: switching months updates KPI card values
test.describe('Dashboard — month switching', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // The app lands on the Dashboard (Charts tab) after login
  });

  test('switching from January to February changes Total Spent KPI value', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Read January Total Spent
    await dashboard.selectMonth('Jan');
    const janSpent = await dashboard.getKpiValue(dashboard.totalSpentCard);

    // Switch to February and read again
    await dashboard.selectMonth('Feb');
    const febSpent = await dashboard.getKpiValue(dashboard.totalSpentCard);

    // The seeded demo data produces different spending per month
    expect(janSpent).not.toEqual(febSpent);
    // Both must be non-empty dollar values
    expect(janSpent).toMatch(/\$[\d,]+/);
    expect(febSpent).toMatch(/\$[\d,]+/);
  });

  test('all four KPI cards remain visible after switching to March', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await dashboard.selectMonth('Mar');

    // All KPI card labels must still be present after the month switch
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });

});
