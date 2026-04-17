import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
});

test('dashboard loads with all 4 KPI cards visible', async ({ page }) => {
  // Confirm we are on the Dashboard
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

  // All 4 KPI summary cards must be present
  await expect(page.getByText('Monthly Income')).toBeVisible();
  await expect(page.getByText('Total Spent')).toBeVisible();
  await expect(page.getByText('Net Savings')).toBeVisible();
  await expect(page.getByText('Transactions')).toBeVisible();
});
