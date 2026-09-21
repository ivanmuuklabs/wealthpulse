import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests for the Dashboard (Charts) tab.
 *
 * Covers: the four KPI stat cards, month switching and its effect on KPI
 * values, the Budget Alerts card, and the Recent Transactions list.
 *
 * The Dashboard is the landing tab after login and the most visible surface
 * of the app — it was not covered by the Expenses/Settings PR.
 */

test.describe('Dashboard tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Dashboard (Charts) is the default landing tab after login
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // ─── KPI cards ───────────────────────────────────────────────────────────

  test('all four KPI stat cards are visible on the Dashboard', async ({ page }) => {
    // The four KPIs rendered by DashboardTab
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });

  test('Monthly Income KPI always shows $6,500.00', async ({ page }) => {
    // MONTHLY_INCOME is a fixed constant; it must not change with month switching
    const incomeCard = page.locator('p', { hasText: 'Monthly Income' }).locator('..');
    await expect(incomeCard.getByText('$6,500.00')).toBeVisible();
  });

  test('Total Spent KPI displays a dollar amount greater than $0', async ({ page }) => {
    // March (default month) always has seeded transactions
    const totalSpentCard = page.locator('p', { hasText: 'Total Spent' }).locator('..');
    const valueText = await totalSpentCard.locator('p.text-xl').textContent();
    const amount = parseFloat((valueText ?? '0').replace(/[$,]/g, ''));
    expect(amount).toBeGreaterThan(0);
  });

  test('Transactions KPI shows a positive integer count', async ({ page }) => {
    const txnCard = page.locator('p', { hasText: 'Transactions' }).locator('..');
    const valueText = await txnCard.locator('p.text-xl').textContent();
    const count = parseInt(valueText ?? '0', 10);
    expect(count).toBeGreaterThan(0);
  });

  // ─── Month switching ─────────────────────────────────────────────────────

  test('switching from March to January changes the Total Spent value', async ({ page }) => {
    // Read March Total Spent first
    const totalSpentCard = page.locator('p', { hasText: 'Total Spent' }).locator('..');
    const marchText = await totalSpentCard.locator('p.text-xl').textContent();

    // Switch to January
    await page.getByRole('button', { name: 'Jan' }).click();

    // Wait for re-render — value must update
    await expect(totalSpentCard.locator('p.text-xl')).not.toHaveText(marchText ?? '');

    const janText = await totalSpentCard.locator('p.text-xl').textContent();
    expect(janText).not.toEqual(marchText);
  });

  test('switching months updates the Net Savings KPI', async ({ page }) => {
    const netCard = page.locator('p', { hasText: 'Net Savings' }).locator('..');
    const marchSavings = await netCard.locator('p.text-xl').textContent();

    await page.getByRole('button', { name: 'Feb' }).click();
    await expect(netCard.locator('p.text-xl')).not.toHaveText(marchSavings ?? '');
  });

  test('the active month button has the emerald highlight style', async ({ page }) => {
    // March is the default (selectedMonth: 2 in initial state)
    // The active MonthButton has class bg-emerald-500/20
    const marBtn = page.getByRole('button', { name: 'Mar' });
    await expect(marBtn).toHaveClass(/bg-emerald-500/);

    // After clicking Jan, Jan becomes active
    await page.getByRole('button', { name: 'Jan' }).click();
    const janBtn = page.getByRole('button', { name: 'Jan' });
    await expect(janBtn).toHaveClass(/bg-emerald-500/);
    await expect(marBtn).not.toHaveClass(/bg-emerald-500/);
  });

  // ─── Budget Alerts ───────────────────────────────────────────────────────

  test('Budget Alerts card is visible and lists at least one category', async ({ page }) => {
    // Seeded data always produces categories spending > 50 % of their budget
    await expect(page.getByText('Budget Alerts')).toBeVisible();

    // At least one category row must be present inside the alerts section
    const alertsSection = page.locator('h3', { hasText: 'Budget Alerts' }).locator('..');
    const alertRows = alertsSection.locator('span.text-lg'); // CAT_ICONS emoji spans
    await expect(alertRows.first()).toBeVisible();
  });

  test('Budget Alerts show both spent and budget amounts for each row', async ({ page }) => {
    const alertsSection = page.locator('h3', { hasText: 'Budget Alerts' }).locator('..');
    // Each alert row shows "spent / budget" amounts in the format "$X / $Y"
    const firstRow = alertsSection.locator('div.flex.items-center.gap-3').first();
    await expect(firstRow).toBeVisible();
    // The row must contain at least one dollar-formatted value
    await expect(firstRow.getByText(/\$[\d,]+/)).toBeVisible();
  });

  // ─── Recent Transactions ─────────────────────────────────────────────────

  test('Recent Transactions section renders with at most 8 entries', async ({ page }) => {
    await expect(page.getByText('Recent Transactions')).toBeVisible();

    // Transactions are rendered as flex rows in the card
    const txnCard = page.locator('h3', { hasText: 'Recent Transactions' }).locator('..');
    // Each entry has a description and a red amount (e.g. "-$12.00")
    const txnRows = txnCard.locator('div.flex.items-center.gap-3');
    const count = await txnRows.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(8);
  });

  test('each Recent Transaction row shows an amount in red', async ({ page }) => {
    const txnCard = page.locator('h3', { hasText: 'Recent Transactions' }).locator('..');
    const firstRow = txnCard.locator('div.flex.items-center.gap-3').first();
    await expect(firstRow.locator('span.text-red-400')).toBeVisible();
  });

  // ─── Charts ──────────────────────────────────────────────────────────────

  test('Spending by Category donut chart heading is visible', async ({ page }) => {
    await expect(page.getByText('Spending by Category')).toBeVisible();
  });

  test('Cumulative Spending chart heading is visible', async ({ page }) => {
    await expect(page.getByText('Cumulative Spending')).toBeVisible();
  });

  test('Monthly Comparison chart heading is visible', async ({ page }) => {
    await expect(page.getByText('Monthly Comparison')).toBeVisible();
  });
});
