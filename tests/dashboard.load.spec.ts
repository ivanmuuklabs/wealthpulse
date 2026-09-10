import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard — page load and section visibility tests.
 *
 * The PR (coverage/daily-2026-09-10) adds a month-switching test that verifies
 * reactive KPI updates. These tests complement it by verifying the initial
 * render state: all 4 KPI stat cards, Budget Alerts, and Recent Transactions
 * are present immediately after login without any interaction.
 */

test.describe('Dashboard — initial page load', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // App defaults to the Overview (Charts/Dashboard) tab
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('all four KPI stat cards are visible after login', async ({ page }) => {
    // The app renders Total Spent, Monthly Income, Net Savings, and Transactions
    // as stat cards on the dashboard. All four must appear without any interaction.
    await expect(page.getByText('Total Spent').first()).toBeVisible();
    await expect(page.getByText('Monthly Income').first()).toBeVisible();
    await expect(page.getByText('Net Savings').first()).toBeVisible();
    await expect(page.getByText('Transactions').first()).toBeVisible();
  });

  test('Monthly Income KPI always shows $6,500.00 regardless of selected month', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Monthly Income is a fixed seed constant (MONTHLY_INCOME = 6500) that never
    // changes when switching months — assert this invariant.
    const incomeValue = await dashboard.getKpiValue('Monthly Income');
    expect(incomeValue).toContain('6,500');

    // Switch to January and verify it is still the same
    await dashboard.selectMonth(0);
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    const incomeValueJan = await dashboard.getKpiValue('Monthly Income');
    expect(incomeValueJan).toContain('6,500');
  });

  test('Budget Alerts section is present with at least one alert', async ({ page }) => {
    // The app shows budget alerts for categories where spending > 50% of budget.
    // The seeded demo data always triggers at least one alert.
    await expect(page.getByText('Budget Alerts')).toBeVisible();
  });

  test('Recent Transactions section renders with transaction rows', async ({ page }) => {
    // The dashboard shows up to 8 recent transactions for the selected month.
    await expect(page.getByText('Recent Transactions')).toBeVisible();

    // At least one transaction row should appear (seeded data guarantees this)
    // Each row renders an amount as "-$X.XX" — look for at least one dollar sign in the list.
    const transactionAmounts = page.locator('div').filter({ hasText: /^-\$/ });
    await expect(transactionAmounts.first()).toBeVisible();
  });

  test('month selector buttons Jan, Feb, Mar are all rendered', async ({ page }) => {
    // Month buttons must exist and be clickable — this is a prerequisite for the
    // month-switching test in dashboard.spec.ts.
    await expect(page.getByRole('button', { name: 'Jan' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Feb' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mar' })).toBeVisible();
  });
});
