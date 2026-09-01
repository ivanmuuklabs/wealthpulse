import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.describe('Sidebar navigation — Reports tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    const loginPage = factory.login();
    await loginPage.goto();
    await loginPage.loginAsDemo();
  });

  test('sidebar shows "Reports" label instead of "Dashboard"', async ({ page }) => {
    await expect(page.getByRole('button', { name: /reports/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /dashboard/i })).not.toBeVisible();
  });

  test('"Reports" nav item is active after login', async ({ page }) => {
    await expect(page.getByRole('button', { name: /reports/i })).toHaveClass(/text-emerald-400/);
  });

  test('clicking "Reports" in sidebar loads the Dashboard overview', async ({ page }) => {
    // Navigate away first, then come back via the renamed nav item
    await page.getByRole('button', { name: /expenses/i }).click();
    await page.getByRole('button', { name: /reports/i }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });
});
