import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard (Overview) tests
 * ==========================
 * User story: "As a user I want to see my financial overview for any month
 * so that I can quickly understand my spending, income, and savings."
 *
 * Acceptance criteria:
 *  Happy path:
 *    AC1. After login the Dashboard loads with the "Overview" heading.
 *    AC2. All four KPI stat cards are visible (Total Spent, Monthly Income, Net Savings, Transactions).
 *    AC3. Monthly Income is always $6,500.00 regardless of the selected month.
 *    AC4. Switching months updates the Total Spent KPI.
 *    AC5. All three chart section headings render.
 *    AC6. Recent Transactions card shows at least one row.
 *    AC7. Budget Alerts section appears (seeded data puts some categories over 50% of budget).
 *  Negative path:
 *    AC8. Total Spent is never negative in any month.
 *    AC9. After switching months the Overview heading remains visible (no crash/nav away).
 */

test.describe('Dashboard — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Dashboard is the default tab after login
    await expect(factory.dashboard().overviewHeading).toBeVisible();
  });

  // AC1 — Overview heading visible after login
  test('Dashboard shows the Overview heading immediately after login', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await expect(dashboard.overviewHeading).toBeVisible();
  });

  // AC2 — All four KPI stat cards are visible
  test('all four KPI stat cards are visible on the dashboard', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Each label lives in a small <p> tag inside its StatCard
    await expect(dashboard.totalSpentCard).toBeVisible();
    await expect(dashboard.monthlyIncomeCard).toBeVisible();
    await expect(dashboard.netSavingsCard).toBeVisible();
    await expect(dashboard.transactionsCard).toBeVisible();
  });

  // AC3 — Monthly Income is always $6,500.00
  test('Monthly Income KPI always shows $6,500.00 regardless of selected month', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Check for January
    await dashboard.janButton.click();
    const janIncome = page
      .locator('div')
      .filter({ has: page.locator('p', { hasText: 'Monthly Income' }) })
      .locator('p.text-xl')
      .first();
    await expect(janIncome).toHaveText('$6,500.00');

    // Switch to February
    await dashboard.febButton.click();
    await expect(janIncome).toHaveText('$6,500.00');

    // Switch to March
    await dashboard.marButton.click();
    await expect(janIncome).toHaveText('$6,500.00');
  });

  // AC4 — Switching months updates Total Spent
  test('switching from January to March shows different Total Spent values', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await dashboard.janButton.click();
    const totalSpentLocator = page
      .locator('div')
      .filter({ has: page.locator('p', { hasText: 'Total Spent' }) })
      .locator('p.text-xl')
      .first();

    const janSpent = await totalSpentLocator.textContent();

    await dashboard.marButton.click();
    const marSpent = await totalSpentLocator.textContent();

    // Seeded data differs between months — the displayed values should differ
    expect(janSpent).not.toEqual(marSpent);
  });

  // AC5 — All three chart section headings render
  test('all three chart section headings are visible', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await expect(dashboard.spendingByCategoryHeading).toBeVisible();
    await expect(dashboard.cumulativeSpendingHeading).toBeVisible();
    await expect(dashboard.monthlyComparisonHeading).toBeVisible();
  });

  // AC6 — Recent Transactions card shows at least one row
  test('Recent Transactions card is visible and shows at least one transaction', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await expect(dashboard.recentTransactionsHeading).toBeVisible();

    // The app renders up to 8 recent transactions; at least 1 must appear
    // Each row has a description and a red amount; locate by the red amount pattern
    const rows = page.locator('div').filter({ has: page.locator('span.text-red-400') }).filter({ hasText: /-\$/ });
    await expect(rows.first()).toBeVisible();
  });

  // AC7 — Budget Alerts section appears
  test('Budget Alerts section is visible with seeded spending data', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // The seeded data reliably pushes at least one category above 50% of its budget,
    // so the Budget Alerts card always renders
    await expect(dashboard.budgetAlertsHeading).toBeVisible();
  });
});

test.describe('Dashboard — negative path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(factory.dashboard().overviewHeading).toBeVisible();
  });

  // AC8 — Total Spent is never negative
  test('Total Spent KPI is never a negative dollar amount in any month', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    const totalSpentLocator = page
      .locator('div')
      .filter({ has: page.locator('p', { hasText: 'Total Spent' }) })
      .locator('p.text-xl')
      .first();

    for (const monthButton of [dashboard.janButton, dashboard.febButton, dashboard.marButton]) {
      await monthButton.click();
      const text = await totalSpentLocator.textContent();
      // A negative amount would start with "-$"; a zero or positive amount starts with "$"
      expect(text?.trim()).toMatch(/^\$/);
    }
  });

  // AC9 — Switching months does not navigate away from the Dashboard
  test('switching between all three months keeps the Overview heading visible', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await dashboard.janButton.click();
    await expect(dashboard.overviewHeading).toBeVisible();

    await dashboard.febButton.click();
    await expect(dashboard.overviewHeading).toBeVisible();

    await dashboard.marButton.click();
    await expect(dashboard.overviewHeading).toBeVisible();
  });
});
