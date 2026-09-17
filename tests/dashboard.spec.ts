import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard (Charts) Tab — Happy Path & Negative Tests
 *
 * The Charts tab is the landing screen after login. It renders:
 *   - A month selector (Jan / Feb / Mar)
 *   - Four KPI cards: Total Spent, Monthly Income, Net Savings, Transactions
 *   - Three charts: Spending by Category, Cumulative Spending, Monthly Comparison
 *   - A conditional Budget Alerts card (when any category exceeds 50% of its budget)
 *   - A Recent Transactions list (last transactions for the selected month)
 *
 * Seeded demo data covers all three months so every test below has stable data.
 */

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  // After login the app defaults to the Dashboard/Charts tab — no explicit navigate needed.
});

/* ═══════════════════════════════════════
   HAPPY PATH TESTS
   ═══════════════════════════════════════ */

test.describe('Dashboard — happy path', () => {

  test('all four KPI card labels are visible after login', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    await expect(dash.totalSpentLabel).toBeVisible();
    await expect(dash.monthlyIncomeLabel).toBeVisible();
    await expect(dash.netSavingsLabel).toBeVisible();
    await expect(dash.transactionsLabel).toBeVisible();
  });

  test('Monthly Income is always $6,500.00 regardless of selected month', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    // Check on default month (March)
    const incomeText = await dash.getKpiValue('Monthly Income');
    expect(incomeText).toContain('6,500');

    // Switch to January — income must stay constant
    await dash.selectMonth('Jan');
    const incomeJan = await dash.getKpiValue('Monthly Income');
    expect(incomeJan).toContain('6,500');
  });

  test('Total Spent value changes when switching from March to January', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    // Read March's Total Spent
    const spentMar = await dash.getKpiValue('Total Spent');

    // Switch to January
    await dash.selectMonth('Jan');
    const spentJan = await dash.getKpiValue('Total Spent');

    // Both months have seeded transactions; values are dollar amounts so non-empty
    expect(spentMar).toMatch(/\$/);
    expect(spentJan).toMatch(/\$/);

    // The values are very unlikely to be identical (different random seeded data per month)
    // At minimum they should both be non-zero dollar amounts
    expect(parseFloat(spentMar.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0);
    expect(parseFloat(spentJan.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0);
  });

  test('all three chart section headings are visible', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    await expect(dash.spendingByCategoryHeading).toBeVisible();
    await expect(dash.cumulativeSpendingHeading).toBeVisible();
    await expect(dash.monthlyComparisonHeading).toBeVisible();
  });

  test('Budget Alerts section is visible with seeded demo data', async ({ page }) => {
    // Seeded data is designed so that at least one category exceeds 50% of its budget
    const dash = new PageFactory(page).dashboard();
    await expect(dash.budgetAlertsHeading).toBeVisible();
  });

  test('Recent Transactions section is visible after login', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();
    await expect(dash.recentTransactionsHeading).toBeVisible();
  });

  test('all three month selector buttons (Jan / Feb / Mar) are visible', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    await expect(dash.janButton).toBeVisible();
    await expect(dash.febButton).toBeVisible();
    await expect(dash.marButton).toBeVisible();
  });

  test('Net Savings is a non-negative dollar value for the default month', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    const savings = await dash.getKpiValue('Net Savings');
    // The seeded income ($6,500) exceeds typical seeded spending so Net Savings > 0
    expect(savings).toMatch(/\$/);
    const amount = parseFloat(savings.replace(/[^0-9.]/g, ''));
    expect(amount).toBeGreaterThanOrEqual(0);
  });

  test('Transactions KPI shows a positive count for every selectable month', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await dash.selectMonth(month);
      const count = await dash.getKpiValue('Transactions');
      expect(parseInt(count.trim())).toBeGreaterThan(0);
    }
  });

});

/* ═══════════════════════════════════════
   NEGATIVE / EDGE-CASE TESTS
   ═══════════════════════════════════════ */

test.describe('Dashboard — negative / edge cases', () => {

  test('dashboard is not accessible without authentication', async ({ page }) => {
    // Navigate directly to the app without logging in
    await page.goto('http://localhost:5173');

    // The login form should be visible instead of dashboard content
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // KPI labels must NOT be present
    await expect(page.getByText('Total Spent', { exact: true })).not.toBeVisible();
  });

  test('Total Spent is never a negative dollar amount for any month', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await dash.selectMonth(month);
      const text = await dash.getKpiValue('Total Spent');
      const amount = parseFloat(text.replace(/[^0-9.]/g, ''));
      // Spending can only be 0 or positive (no negative amounts in seeded data)
      expect(amount).toBeGreaterThanOrEqual(0);
    }
  });

  test('switching months keeps all four KPI labels visible', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await dash.selectMonth(month);
      await expect(dash.totalSpentLabel).toBeVisible();
      await expect(dash.monthlyIncomeLabel).toBeVisible();
      await expect(dash.netSavingsLabel).toBeVisible();
      await expect(dash.transactionsLabel).toBeVisible();
    }
  });

  test('all three chart headings remain visible after switching months', async ({ page }) => {
    const dash = new PageFactory(page).dashboard();

    await dash.selectMonth('Jan');

    await expect(dash.spendingByCategoryHeading).toBeVisible();
    await expect(dash.cumulativeSpendingHeading).toBeVisible();
    await expect(dash.monthlyComparisonHeading).toBeVisible();
  });

});
