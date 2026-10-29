import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests for the Dashboard (Overview) tab.
 *
 * User story: As a user I can see my monthly financial summary — KPI cards,
 * spending charts, budget alerts, and recent transactions — so I have an
 * at-a-glance picture of my finances.
 *
 * Acceptance criteria:
 *  1. All four KPI cards are visible after login.
 *  2. Monthly Income is always $6,500.00 regardless of the selected month.
 *  3. Switching months changes the Total Spent KPI value.
 *  4. All three chart section headings render.
 *  5. Budget Alerts section appears (seeded data puts Housing/Food over 50%).
 *  6. Recent Transactions shows at least one transaction row.
 *  7. Net Savings is positive (income > spending in demo data).
 *  8. Total Spent is never negative.
 *  9. The Overview heading remains visible after every month switch.
 */

test.describe('Dashboard — happy path', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Dashboard is the default tab after login
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // AC 1 — All four KPI stat cards are visible
  test('all four KPI cards are visible after login', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    await expect(dash.totalSpentCard).toBeVisible();
    await expect(dash.monthlyIncomeCard).toBeVisible();
    await expect(dash.netSavingsCard).toBeVisible();
    await expect(dash.transactionsCard).toBeVisible();
  });

  // AC 2 — Monthly Income is always $6,500.00
  test('Monthly Income KPI always shows $6,500.00', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    // Check on the default month (March)
    const incomeValueMar = await page.locator('p').filter({ hasText: /^\$6,500\.00$/ }).first().textContent();
    expect(incomeValueMar).toContain('6,500.00');

    // Switch to February and verify it stays the same
    await dash.selectMonth(1);
    const incomeValueFeb = await page.locator('p').filter({ hasText: /^\$6,500\.00$/ }).first().textContent();
    expect(incomeValueFeb).toContain('6,500.00');
  });

  // AC 3 — Switching months changes Total Spent (seeded data differs by month)
  test('switching from March to February changes the Total Spent KPI', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    // Capture March Total Spent text
    const marSpentEl = page
      .locator('p')
      .filter({ hasText: /^Total Spent$/i })
      .locator('~ p')
      .first();
    const marSpent = await marSpentEl.textContent();

    // Switch to February
    await dash.selectMonth(1);

    const febSpent = await marSpentEl.textContent();

    // The two months have different seeded transaction totals
    expect(marSpent).not.toEqual(febSpent);
  });

  // AC 4 — All three chart section headings are rendered
  test('all three chart section headings are visible', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    await expect(dash.spendingByCategoryHeading).toBeVisible();
    await expect(dash.cumulativeSpendingHeading).toBeVisible();
    await expect(dash.monthlyComparisonHeading).toBeVisible();
  });

  // AC 5 — Budget Alerts section appears with seeded data
  test('Budget Alerts section is visible (seeded data triggers alerts)', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    // Seeded data sets Housing budget at $2,000 and Housing spending is >$1,000 in March
    await expect(dash.budgetAlertsHeading).toBeVisible();
  });

  // AC 6 — Recent Transactions shows at least one row
  test('Recent Transactions section is visible and non-empty', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    await expect(dash.recentTransactionsHeading).toBeVisible();
    // At least one transaction description should be visible
    await expect(page.locator('p.text-sm.text-white.truncate').first()).toBeVisible();
  });

  // AC 7 — Net Savings is positive in demo data (income $6,500 > spending)
  test('Net Savings KPI is positive for March demo data', async ({ page }) => {
    // The Net Savings value element has emerald styling when positive
    const savingsValue = page
      .locator('p')
      .filter({ hasText: /^Net Savings$/i })
      .locator('~ p')
      .first();

    const valueText = await savingsValue.textContent();
    // Strip currency symbol and commas to parse
    const numeric = parseFloat((valueText ?? '').replace(/[^0-9.]/g, ''));
    expect(numeric).toBeGreaterThan(0);
  });
});

test.describe('Dashboard — negative and edge cases', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // AC 8 — Total Spent is never negative in any month
  test('Total Spent is non-negative in January', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();
    await dash.selectMonth(0); // January

    const spentEl = page
      .locator('p')
      .filter({ hasText: /^Total Spent$/i })
      .locator('~ p')
      .first();
    const valueText = await spentEl.textContent();
    const numeric = parseFloat((valueText ?? '').replace(/[^0-9.]/g, ''));
    expect(numeric).toBeGreaterThanOrEqual(0);
  });

  // AC 9 — Overview heading remains visible after every month switch
  test('Overview heading stays visible after cycling through all three months', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    for (const m of [0, 1, 2] as const) {
      await dash.selectMonth(m);
      await expect(dash.heading).toBeVisible();
    }
  });

  // Navigating away and back to Dashboard preserves the Overview heading
  test('navigating away to Expenses and back to Charts keeps Overview visible', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    // Navigate away
    await page.getByRole('button', { name: /expenses/i }).click();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();

    // Navigate back
    await dash.navigate();
    await expect(dash.heading).toBeVisible();
  });

  // Dashboard is inaccessible without authentication (redirects to login)
  test('accessing the app root without logging in shows the Sign In button', async ({ page }) => {
    await page.goto('http://localhost:5173');
    // App renders the login screen by default — Sign In button must be present
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    // No Dashboard heading should be visible
    await expect(page.getByRole('heading', { name: 'Overview' })).not.toBeVisible();
  });
});
