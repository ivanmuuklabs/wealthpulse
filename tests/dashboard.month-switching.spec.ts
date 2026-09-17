import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests for the Dashboard (Charts) month-switching behaviour.
 *
 * The Overview page shows Jan / Feb / Mar buttons. Switching months must
 * update all four KPI cards with month-specific values.  These tests
 * pin the core financial data-integrity contract on the dashboard.
 */

test.describe('Dashboard — month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we landed on the dashboard
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // Test 1 — KPI values change when switching between months
  test('Total Spent KPI updates when switching from March to January', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Default selected month is March (index 2); read its Total Spent value
    const marValue = await dashboard.getKpiValue('Total Spent');

    // Switch to January and read again
    await dashboard.selectMonth('Jan');
    const janValue = await dashboard.getKpiValue('Total Spent');

    // Seeded data generates different spending per month — values must differ
    expect(janValue).not.toBeNull();
    expect(marValue).not.toBeNull();
    expect(janValue).not.toEqual(marValue);
  });

  // Test 2 — All four KPI cards remain visible after switching months
  test('all four KPI cards remain visible after switching to February', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await dashboard.selectMonth('Feb');

    // Every KPI card must still be rendered
    await expect(page.getByText('Total Spent').first()).toBeVisible();
    await expect(page.getByText('Monthly Income').first()).toBeVisible();
    await expect(page.getByText('Net Savings').first()).toBeVisible();
    await expect(page.getByText('Transactions').first()).toBeVisible();
  });
});
