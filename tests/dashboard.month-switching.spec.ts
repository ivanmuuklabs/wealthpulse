import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Test 1 — Dashboard: switching months updates the KPI cards
 *
 * Coverage gap addressed: the Dashboard month selector was previously untested.
 * The app has seeded data for Jan, Feb, and Mar 2026; switching months must
 * produce different "Total Spent" and "Transactions" values, confirming that
 * the month-filter reducer (SET_MONTH) correctly re-derives the KPI row.
 */
test.describe('Dashboard — month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we are on the Overview page before each test
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('switching from March to January shows different Total Spent and Transactions values', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // App defaults to March (selectedMonth: 2).  Read the baseline KPI values.
    const marSpent = await dashboard.getTotalSpentText();
    const marTxns = await dashboard.transactionsValue.textContent();

    // Switch to January
    await dashboard.selectMonth('Jan');

    // KPI cards must update — the heading must still be visible (no nav away)
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    const janSpent = await dashboard.getTotalSpentText();
    const janTxns = await dashboard.transactionsValue.textContent();

    // Seeded data generates transactions independently per month, so values differ
    expect(janSpent).not.toEqual(marSpent);
    expect(janTxns).not.toEqual(marTxns);
  });
});
