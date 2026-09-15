import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard (Charts) tab tests
 *
 * User story: As a user I can view my monthly spending overview — KPI cards,
 * category breakdown chart, cumulative spending chart, budget alerts, and
 * recent transactions — and switch between Jan / Feb / Mar to compare months.
 *
 * Happy path:  page loads with data, KPI values are non-zero, month switching
 *              updates the displayed figures, Budget Alerts and Recent
 *              Transactions sections render correctly.
 * Negative:    KPI updates when switching months (values actually change).
 */

test.describe('Dashboard — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Dashboard is the default tab after login
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('Dashboard loads with the Overview heading visible after login', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await expect(dashboard.heading).toBeVisible();
  });

  test('all four KPI stat cards are displayed on load', async ({ page }) => {
    // Each KPI label should be visible on the default month (March)
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });

  test('Total Spent KPI shows a non-zero dollar value for the default month (March)', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // The seeded data always has transactions in March (month index 2)
    const totalSpent = await dashboard.getKpiValue('Total Spent');
    expect(totalSpent).toMatch(/^\$[\d,]+\.\d{2}$/);

    // Value must not be $0.00 — seeded data guarantees spending
    expect(totalSpent).not.toBe('$0.00');
  });

  test('Monthly Income KPI always shows $6,500.00 (the fixed demo income)', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    const income = await dashboard.getKpiValue('Monthly Income');
    expect(income).toBe('$6,500.00');
  });

  test('month switcher is visible with Jan, Feb, Mar buttons', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await expect(dashboard.janButton).toBeVisible();
    await expect(dashboard.febButton).toBeVisible();
    await expect(dashboard.marButton).toBeVisible();
  });

  test('switching from March to January changes the Total Spent KPI value', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Read March value (default)
    const marValue = await dashboard.getKpiValue('Total Spent');

    // Switch to January
    await dashboard.janButton.click();

    // Read January value — seeded data produces different totals each month
    const janValue = await dashboard.getKpiValue('Total Spent');

    // The values must differ (random seed means they're virtually guaranteed to differ)
    expect(janValue).not.toEqual(marValue);
  });

  test('switching to February shows the correct month label in the header', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await dashboard.febButton.click();

    // The header subtitle shows "February 2026" when Feb is selected
    await expect(page.locator('header')).toContainText('February 2026');
  });

  test('Budget Alerts section is visible on the default month', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Budget Alerts appear when any category exceeds 50% of its limit.
    // With seeded data this is always true for the default month (March).
    await expect(dashboard.budgetAlertsHeading).toBeVisible();
  });

  test('Recent Transactions section is visible and contains at least one item', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await expect(dashboard.recentTransactionsHeading).toBeVisible();

    // The section shows the 8 most recent transactions for the selected month
    await expect(dashboard.recentTransactionItems.first()).toBeVisible();
  });
});

test.describe('Dashboard — negative / edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('switching months rapidly (Jan → Feb → Mar) ends on the correct KPI value', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Quickly switch through all three months
    await dashboard.janButton.click();
    await dashboard.febButton.click();
    await dashboard.marButton.click();

    // After settling on March the header should show "March 2026"
    await expect(page.locator('header')).toContainText('March 2026');

    // And Total Spent should still be a valid dollar figure
    const value = await dashboard.getKpiValue('Total Spent');
    expect(value).toMatch(/^\$[\d,]+\.\d{2}$/);
  });

  test('Transactions KPI count matches the number of Recent Transaction rows shown', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // The KPI card shows the total count of transactions in the month.
    // The Recent Transactions list shows at most 8.
    const countText = await dashboard.getKpiValue('Transactions');
    const count = parseInt(countText, 10);

    // Recent Transactions renders up to 8 rows (slice(0, 8) in the app)
    const rowCount = await dashboard.recentTransactionItems.count();
    expect(rowCount).toBe(Math.min(count, 8));
  });

  test('Net Savings equals Monthly Income minus Total Spent (within $1 rounding)', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    const incomeText = await dashboard.getKpiValue('Monthly Income');
    const spentText = await dashboard.getKpiValue('Total Spent');
    const savingsText = await dashboard.getKpiValue('Net Savings');

    const parse = (s: string) => parseFloat(s.replace(/[$,]/g, ''));
    const income = parse(incomeText);
    const spent = parse(spentText);
    const savings = parse(savingsText);

    // Net Savings = Income - Total Spent (allow $1 floating-point tolerance)
    expect(Math.abs(savings - (income - spent))).toBeLessThanOrEqual(1);
  });
});
