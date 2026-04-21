import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.describe('Smoke — WealthPulse is up', () => {
  test('login page loads and shows credentials form', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // The login form must be visible before any credentials are entered
    await expect(page.getByPlaceholder('demo')).toBeVisible();
    await expect(page.getByPlaceholder('demo123')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('successful login lands on a fully rendered Dashboard', async ({ page }) => {
    const factory = new PageFactory(page);
    const loginPage = factory.login();

    await loginPage.goto();
    await loginPage.loginAsDemo();

    // ── Page identity ──────────────────────────────────────────────
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await expect(page.locator('header h1')).toHaveText('dashboard');

    // ── KPI cards ──────────────────────────────────────────────────
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();

    // ── Charts section ─────────────────────────────────────────────
    await expect(page.getByText('Spending by Category')).toBeVisible();

    // ── Month filter ───────────────────────────────────────────────
    await expect(page.getByRole('button', { name: 'Jan' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Feb' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mar' })).toBeVisible();

    // ── Sidebar navigation links ───────────────────────────────────
    await expect(page.getByRole('button', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /expenses/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /investments/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /budgets/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /settings/i })).toBeVisible();

    // ── Sign Out is available ──────────────────────────────────────
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
  });
});
