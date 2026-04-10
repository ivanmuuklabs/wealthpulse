import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test('successful login with demo/demo123 lands on Dashboard', async ({ page }) => {
  const factory = new PageFactory(page);

  const loginPage = factory.login();
  await loginPage.goto();
  await loginPage.loginAsDemo();

  // Sidebar shows the Dashboard item as active
  await expect(page.getByRole('button', { name: /dashboard/i })).toHaveClass(/text-emerald-400/);

  // Main heading confirms we are on the Overview page
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

  // Top bar shows the current page title as "dashboard"
  await expect(page.locator('header h1')).toHaveText('dashboard');

  // All 4 KPI cards are present
  await expect(page.getByText('Monthly Income')).toBeVisible();
  await expect(page.getByText('Total Spent')).toBeVisible();
  await expect(page.getByText('Net Savings')).toBeVisible();
  await expect(page.getByText('Transactions')).toBeVisible();
});
