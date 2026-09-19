import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard (Charts) tab — happy path and negative tests.
 *
 * User story: As a logged-in user I can view the financial Overview for each
 * month (Jan / Feb / Mar), switch between months, and see the four KPI cards
 * update accordingly — so that I can understand my spending at a glance.
 *
 * Covers:
 *  Happy path — KPI cards present after login, month switching updates the
 *               displayed data, budget-alert section visibility, and the
 *               recent-transactions list.
 *  Negative  — switching to a month and back confirms values differ,
 *               and the charts section does not crash when switching months.
 */

test.describe('Dashboard — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Default landing page is the Dashboard/Charts tab
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('all four KPI cards are visible on the default (March) view', async ({ page }) => {
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });

  test('Monthly Income KPI always shows $6,500.00', async ({ page }) => {
    // Seeded monthly income is a fixed $6,500
    const incomeCard = page.getByText('Monthly Income').locator('..');
    await expect(incomeCard).toContainText('$6,500.00');
  });

  test('switching to January updates the Total Spent KPI', async ({ page }) => {
    // Read March Total Spent
    const totalSpentCard = page.getByText('Total Spent').locator('..');
    const marchSpent = await totalSpentCard.locator('p.text-xl').textContent();

    // Switch to January
    await page.getByRole('button', { name: 'Jan' }).click();

    const janSpent = await totalSpentCard.locator('p.text-xl').textContent();

    // The two months have independent seeded data so the values must differ
    expect(marchSpent).not.toEqual(janSpent);
  });

  test('switching to February shows a non-zero Total Spent', async ({ page }) => {
    await page.getByRole('button', { name: 'Feb' }).click();

    const totalSpentCard = page.getByText('Total Spent').locator('..');
    const value = await totalSpentCard.locator('p.text-xl').textContent();

    // Must be a dollar amount, not $0
    expect(value).toMatch(/\$[1-9]/);
  });

  test('Net Savings KPI updates when month is changed', async ({ page }) => {
    const netSavingsCard = page.getByText('Net Savings').locator('..');
    const marchSavings = await netSavingsCard.locator('p.text-xl').textContent();

    await page.getByRole('button', { name: 'Jan' }).click();

    const janSavings = await netSavingsCard.locator('p.text-xl').textContent();
    // Different months → different savings (seeded to diverge)
    expect(marchSavings).not.toEqual(janSavings);
  });

  test('Budget Alerts section is visible and lists at least one category', async ({ page }) => {
    // Budget Alerts appear for categories that have spent > 50 % of their limit.
    // The seeded data ensures this for March (default month).
    await expect(page.getByText('Budget Alerts')).toBeVisible();

    // At least one progress bar row exists inside the alerts card
    const alertRows = page.locator('div').filter({ hasText: /Budget Alerts/ })
      .locator('div.flex.items-center.gap-3');
    const count = await alertRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Recent Transactions list shows up to 8 entries', async ({ page }) => {
    await expect(page.getByText('Recent Transactions')).toBeVisible();

    // Each row has a description + category + amount — count via amount cells
    const recentItems = page.locator('div').filter({ hasText: /Recent Transactions/ })
      .locator('div.flex.items-center.gap-3');
    const count = await recentItems.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(8);
  });

  test('Cumulative Spending chart area is rendered in the dashboard', async ({ page }) => {
    // The recharts AreaChart for daily cumulative spending renders an SVG
    const chart = page.locator('.recharts-area-chart, .recharts-line-chart, .recharts-bar-chart').first();
    await expect(chart).toBeVisible();
  });
});

test.describe('Dashboard — negative tests', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('switching months and back restores the original March values', async ({ page }) => {
    const totalSpentCard = page.getByText('Total Spent').locator('..');
    const marchSpent = await totalSpentCard.locator('p.text-xl').textContent();

    // Go to Jan
    await page.getByRole('button', { name: 'Jan' }).click();
    // Come back to Mar
    await page.getByRole('button', { name: 'Mar' }).click();

    const backToMarchSpent = await totalSpentCard.locator('p.text-xl').textContent();
    expect(backToMarchSpent).toEqual(marchSpent);
  });

  test('Dashboard does not show an error or blank state for any supported month', async ({ page }) => {
    for (const month of ['Jan', 'Feb', 'Mar']) {
      await page.getByRole('button', { name: month }).click();

      // Heading must remain; no error indicators expected
      await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

      // All four KPI card labels must still be present
      await expect(page.getByText('Monthly Income')).toBeVisible();
      await expect(page.getByText('Total Spent')).toBeVisible();
      await expect(page.getByText('Net Savings')).toBeVisible();
      await expect(page.getByText('Transactions')).toBeVisible();
    }
  });

  test('Transactions KPI count is always a positive integer across all months', async ({ page }) => {
    for (const month of ['Jan', 'Feb', 'Mar']) {
      await page.getByRole('button', { name: month }).click();

      const txnCard = page.getByText('Transactions').locator('..');
      const valueText = await txnCard.locator('p.text-xl').textContent();

      const count = parseInt(valueText ?? '0', 10);
      expect(count).toBeGreaterThan(0);
    }
  });

  test('Active month button carries the emerald highlight class', async ({ page }) => {
    // Switching to January makes its button active
    await page.getByRole('button', { name: 'Jan' }).click();

    const janButton = page.getByRole('button', { name: 'Jan' }).first();
    await expect(janButton).toHaveClass(/emerald/);

    // March button should no longer carry that class
    const marButton = page.getByRole('button', { name: 'Mar' }).first();
    await expect(marButton).not.toHaveClass(/emerald/);
  });
});
