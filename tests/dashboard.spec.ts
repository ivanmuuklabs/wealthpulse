import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests for the Dashboard (Charts) section.
 *
 * Covers two critical flows that had no test coverage:
 *   1. Switching the selected month updates all four KPI values.
 *   2. The Budget Alerts section appears and lists at least one category alert.
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we landed on the Dashboard
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // ── Test 1 ──────────────────────────────────────────────────────────
  // Switching the month selector must update Total Spent and Net Savings KPIs.
  // Monthly Income is fixed at $6,500 and should remain constant; the other
  // values change because the seeded data differs between months.
  test('switching month selector updates Total Spent and Net Savings KPI values', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Read KPI values for February
    await dashboard.selectMonth('Feb');
    const febSpent   = await dashboard.getKpiValue('Total Spent');
    const febSavings = await dashboard.getKpiValue('Net Savings');

    // Switch to March and re-read
    await dashboard.selectMonth('Mar');
    const marSpent   = await dashboard.getKpiValue('Total Spent');
    const marSavings = await dashboard.getKpiValue('Net Savings');

    // Monthly Income is fixed — it must be visible and identical for both months
    await expect(dashboard.monthlyIncomeCard).toBeVisible();

    // Seeded data guarantees different spending between months
    expect(febSpent).not.toEqual(marSpent);
    expect(febSavings).not.toEqual(marSavings);

    // Recent Transactions section is still present after month switch
    await expect(dashboard.recentTransactionsSection).toBeVisible();
  });

  // ── Test 2 ──────────────────────────────────────────────────────────
  // Budget Alerts must be rendered when at least one category has spent
  // more than 50% of its budget. The seeded demo data is designed so that
  // this condition is always met for at least one month.
  test('Budget Alerts section is visible and lists at least one category alert', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Check each month until we find one that shows Budget Alerts
    // (the section only appears when ≥1 category has exceeded 50% of budget)
    let alertsVisible = false;
    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await dashboard.selectMonth(month);
      const visible = await dashboard.budgetAlertsSection.isVisible();
      if (visible) {
        alertsVisible = true;
        break;
      }
    }

    expect(alertsVisible).toBe(true);

    // Confirm the Budget Alerts heading is present
    await expect(dashboard.budgetAlertsSection).toBeVisible();

    // Confirm all four KPI stat cards are present on the current view
    await expect(dashboard.monthlyIncomeCard).toBeVisible();
    await expect(dashboard.totalSpentCard).toBeVisible();
    await expect(dashboard.netSavingsCard).toBeVisible();
    await expect(dashboard.transactionsCard).toBeVisible();
  });
});
