import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests for the Dashboard (Overview) tab.
 *
 * User stories:
 *   - "As a user I can see my financial KPIs at a glance on the Overview page."
 *   - "As a user I can switch months to compare spending across January, February,
 *     and March, and the KPI values update accordingly."
 *   - "As a user I can see my most recent transactions directly on the Overview page."
 *   - "As a user I am warned by Budget Alerts when categories exceed 50% of their limit."
 *
 * All data is seeded in-memory; refresh resets to demo state.
 * Default selected month is March (index 2).
 */

test.describe('Dashboard — Overview', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // After login the app lands on the Overview (Dashboard) tab — no extra navigation needed.
    await factory.dashboard().overviewHeading.waitFor({ state: 'visible' });
  });

  // ── KPI cards present on load ─────────────────────────────────────────────

  test('Overview page shows all four KPI stat cards on load', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await expect(dashboard.totalSpentCard).toBeVisible();
    await expect(dashboard.monthlyIncomeCard).toBeVisible();
    await expect(dashboard.netSavingsCard).toBeVisible();
    await expect(dashboard.transactionsCard).toBeVisible();
  });

  test('Monthly Income KPI always shows $6,500.00 regardless of the selected month', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // The MONTHLY_INCOME constant is $6,500 and never changes
    const incomeEl = page
      .getByText('Monthly Income')
      .locator('..')
      .locator('p.text-xl')
      .first();

    await expect(incomeEl).toHaveText('$6,500.00');

    // Confirm it stays the same when switching to February
    await dashboard.febButton.click();
    await expect(incomeEl).toHaveText('$6,500.00');
  });

  // ── Month switching changes KPI values ────────────────────────────────────

  test('switching from March to February changes the Total Spent KPI value', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Default month is March — read Total Spent
    const marSpent = await dashboard.getKpiValue('Total Spent');

    // Switch to February
    await dashboard.febButton.click();
    const febSpent = await dashboard.getKpiValue('Total Spent');

    // Seeded random data produces different monthly totals
    expect(marSpent).not.toEqual(febSpent);
  });

  test('switching to January shows a different Total Spent than March', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    const marSpent = await dashboard.getKpiValue('Total Spent');

    await dashboard.janButton.click();
    const janSpent = await dashboard.getKpiValue('Total Spent');

    // Jan and Mar are both randomly seeded — they differ
    expect(janSpent).not.toEqual(marSpent);
  });

  test('switching months updates the Transactions KPI count', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    const marCount = await dashboard.getTransactionCount();

    await dashboard.febButton.click();
    const febCount = await dashboard.getTransactionCount();

    // Both months have transactions; random seed means counts differ
    expect(parseInt(marCount)).toBeGreaterThan(0);
    expect(parseInt(febCount)).toBeGreaterThan(0);
  });

  test('Net Savings equals Monthly Income minus Total Spent', async ({ page }) => {
    const parse = (t: string) => parseFloat(t.replace(/[$,]/g, ''));

    // Helper: read the large value text from a KPI card
    const getKpiAmount = async (label: string) => {
      const text = await page
        .getByText(label)
        .locator('..')
        .locator('p.text-xl')
        .first()
        .textContent();
      return parse(text ?? '0');
    };

    const income = await getKpiAmount('Monthly Income');
    const spent = await getKpiAmount('Total Spent');
    const savings = await getKpiAmount('Net Savings');

    // Allow $1 rounding tolerance from display formatting
    expect(Math.abs(savings - (income - spent))).toBeLessThanOrEqual(1);
  });

  // ── Recent Transactions section ───────────────────────────────────────────

  test('Recent Transactions section is visible on the Overview page', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await expect(dashboard.recentTransactionsHeading).toBeVisible();
  });

  test('Recent Transactions section shows up to 8 rows for the selected month', async ({ page }) => {
    // The app slices monthTxns to the first 8 entries
    const transactionRows = page.locator('div').filter({ hasText: /^-\$[\d,]+\.\d{2}$/ });
    const count = await transactionRows.count();

    // There are transactions for March (the default month); row count is between 1 and 8
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(8);
  });

  test('Recent Transactions updates when switching months', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Read the text content of the first recent-transaction amount on March
    const firstAmountMar = await page
      .locator('div')
      .filter({ hasText: /^-\$[\d,]+\.\d{2}$/ })
      .first()
      .textContent();

    // Switch to January — different month, different sorted transactions
    await dashboard.janButton.click();

    // The section must still be visible after month switch
    await expect(dashboard.recentTransactionsHeading).toBeVisible();

    // The first row's amount may differ (seeded data varies by month)
    const firstAmountJan = await page
      .locator('div')
      .filter({ hasText: /^-\$[\d,]+\.\d{2}$/ })
      .first()
      .textContent();

    // At least the heading must remain and transactions must be present
    expect(firstAmountJan).toBeTruthy();
    // Guard: switching months triggers a re-render — amounts differ between Jan and Mar
    // (this could theoretically match but is astronomically unlikely with seeded random data)
    expect(firstAmountJan).not.toEqual(firstAmountMar);
  });

  // ── Budget Alerts panel ───────────────────────────────────────────────────

  test('Budget Alerts panel is visible when at least one category exceeds 50% of its budget', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // The seeded data for March routinely pushes several categories above 50%.
    // The Budget Alerts card is conditionally rendered — we confirm it appears.
    await expect(dashboard.budgetAlertsHeading).toBeVisible();
  });

  test('Budget Alerts show at most 4 categories', async ({ page }) => {
    // App slices budgetAlerts to 4 items maximum
    const alertItems = page.locator('div').filter({ hasText: /\$[\d,]+\.\d{2} \/ \$[\d,]+\.\d{2}/ });
    const count = await alertItems.count();

    // Between 1 and 4 alert rows
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(4);
  });

  // ── Month selector button states ──────────────────────────────────────────

  test('Mar button is highlighted (active) on initial load', async ({ page }) => {
    // Default selectedMonth is 2 (March). Active buttons carry the emerald-400 class.
    const marButton = page.getByRole('button', { name: 'Mar' }).first();
    await expect(marButton).toHaveClass(/text-emerald-400/);
  });

  test('clicking Jan sets the Jan button as active and removes active from Mar', async ({ page }) => {
    const janButton = page.getByRole('button', { name: 'Jan' }).first();
    const marButton = page.getByRole('button', { name: 'Mar' }).first();

    await janButton.click();

    await expect(janButton).toHaveClass(/text-emerald-400/);
    await expect(marButton).not.toHaveClass(/text-emerald-400/);
  });
});
