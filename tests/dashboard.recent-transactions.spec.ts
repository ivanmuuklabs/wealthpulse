import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

// Test 2 — Dashboard: Recent Transactions section is visible and updates on month switch
test.describe('Dashboard — Recent Transactions', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
  });

  test('Recent Transactions heading is visible on the default dashboard view', async ({ page }) => {
    // The app lands on the Dashboard after login; verify the section renders
    await expect(page.getByText('Recent Transactions')).toBeVisible();
  });

  test('Recent Transactions list shows different entries when switching months', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Capture the first transaction amount text in January
    await dashboard.selectMonth('Jan');
    const janFirstAmount = await page
      .locator('text=Recent Transactions')
      .locator('..')
      .locator('text=/\\-?\\$[\\d,]+(\\.\\d+)?/')
      .first()
      .textContent();

    // Switch to March and capture again
    await dashboard.selectMonth('Mar');
    const marFirstAmount = await page
      .locator('text=Recent Transactions')
      .locator('..')
      .locator('text=/\\-?\\$[\\d,]+(\\.\\d+)?/')
      .first()
      .textContent();

    // The seeded demo data has different transactions per month
    // At a minimum the section must still be visible after switching
    await expect(page.getByText('Recent Transactions')).toBeVisible();

    // And the amounts should differ across months (different spending data)
    expect(janFirstAmount).not.toEqual(marFirstAmount);
  });

});
