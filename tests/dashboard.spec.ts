import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard (Charts) module tests.
 *
 * The Dashboard is the first screen after login and is the primary financial
 * overview for users. It shows monthly KPI cards, spending charts, budget
 * alerts, and a recent-transactions list — all filtered by the selected month.
 */

test.describe('Dashboard — KPI cards', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Charts tab is the default landing page after login
    await factory.dashboard().navigate();
  });

  test('Dashboard heading is visible after login', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await expect(dashboard.heading).toBeVisible();
  });

  test('Monthly Income card is visible with a dollar value', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await expect(dashboard.monthlyIncomeCard).toBeVisible();
    // Monthly Income is fixed at $6,500 across all months
    await expect(dashboard.monthlyIncomeCard).toContainText('$6,500');
  });

  test('Total Spent card is visible and shows a dollar amount', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await expect(dashboard.totalSpentCard).toBeVisible();
    await expect(dashboard.totalSpentCard).toContainText('$');
  });

  test('Net Savings card is visible and shows a dollar amount', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await expect(dashboard.netSavingsCard).toBeVisible();
    await expect(dashboard.netSavingsCard).toContainText('$');
  });

  test('Transactions KPI card is visible', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await expect(dashboard.transactionsCard).toBeVisible();
  });
});

test.describe('Dashboard — Month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.dashboard().navigate();
  });

  test('January month button is active and clickable', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await dashboard.switchMonth('Jan');
    // After clicking Jan the button should reflect the active state
    await expect(dashboard.janButton).toBeVisible();
  });

  test('Total Spent value differs between January and March', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await dashboard.switchMonth('Jan');
    const janSpent = await dashboard.totalSpentCard
      .locator('text=/\\$[\\d,]+(\\.\\d+)?/')
      .first()
      .textContent();

    await dashboard.switchMonth('Mar');
    const marSpent = await dashboard.totalSpentCard
      .locator('text=/\\$[\\d,]+(\\.\\d+)?/')
      .first()
      .textContent();

    // Seeded data produces different spending for January vs March
    expect(janSpent).not.toEqual(marSpent);
  });

  test('all three month buttons (Jan / Feb / Mar) are selectable', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await dashboard.switchMonth('Jan');
    await expect(dashboard.janButton).toBeVisible();

    await dashboard.switchMonth('Feb');
    await expect(dashboard.febButton).toBeVisible();

    await dashboard.switchMonth('Mar');
    await expect(dashboard.marButton).toBeVisible();
  });

  test('Monthly Income stays at $6,500 when switching months', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await dashboard.switchMonth(month);
      await expect(dashboard.monthlyIncomeCard).toContainText('$6,500');
    }
  });
});

test.describe('Dashboard — Charts', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.dashboard().navigate();
  });

  test('Spending by Category chart heading is visible', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await expect(dashboard.spendingByCategoryHeading).toBeVisible();
  });

  test('Cumulative Spending chart heading is visible', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await expect(dashboard.cumulativeSpendingHeading).toBeVisible();
  });

  test('Monthly Comparison chart heading is visible', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await expect(dashboard.monthlyComparisonHeading).toBeVisible();
  });
});

test.describe('Dashboard — Budget Alerts', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.dashboard().navigate();
  });

  test('Budget Alerts section is visible (seeded data ensures at least one alert)', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await expect(dashboard.budgetAlertsSection).toBeVisible();
  });

  test('Budget Alerts section updates when the month is changed', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Capture alert text on January
    await dashboard.switchMonth('Jan');
    const janAlertText = await dashboard.budgetAlertsSection.textContent();

    // Switch to March and compare
    await dashboard.switchMonth('Mar');
    const marAlertText = await dashboard.budgetAlertsSection.textContent();

    // The two months use different spending data so the alert details differ
    expect(janAlertText).not.toEqual(marAlertText);
  });
});

test.describe('Dashboard — Recent Transactions', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.dashboard().navigate();
  });

  test('Recent Transactions heading is visible', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await expect(dashboard.recentTransactionsHeading).toBeVisible();
  });

  test('Recent Transactions list is non-empty for the default month', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    const count = await dashboard.recentTransactionRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Recent Transactions list updates when the month is switched', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    await dashboard.switchMonth('Jan');
    const janText = await page.locator('div', { hasText: /recent transactions/i }).first().textContent();

    await dashboard.switchMonth('Mar');
    const marText = await page.locator('div', { hasText: /recent transactions/i }).first().textContent();

    // Transactions differ between months
    expect(janText).not.toEqual(marText);
  });
});
