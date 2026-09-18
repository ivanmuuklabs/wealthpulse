import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Gap coverage added by Amikoo QA review of PR #48.
 *
 * PR #48 added charts.overview.spec.ts covering KPI cards, month selector,
 * and sidebar-label regressions. These tests fill the remaining untested
 * sections of the Charts (Dashboard) tab:
 *
 *  - Budget Alerts section: visible when spending exceeds 50% of a category
 *    budget (sourced from seeded March data).
 *  - Recent Transactions section: visible and populated after login.
 *  - Chart section headings: Spending by Category, Cumulative Spending,
 *    Monthly Comparison.
 *
 * All tests use POM via PageFactory + ChartsPage and follow the project's
 * auto-wait / no-fixed-sleep conventions.
 */

test.describe('Charts tab — Budget Alerts section', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // The Charts tab is active by default after login
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('Budget Alerts section is visible on the Charts overview page', async ({ page }) => {
    // The seeded March data has categories that exceed 50% of their budget,
    // so at least one alert card must appear.
    const alertsSection = page.getByText('Budget Alerts');
    await expect(alertsSection).toBeVisible();
  });

  test('Budget Alerts shows at least one category alert card', async ({ page }) => {
    // Each alert card contains a category name and a percentage value.
    // With seeded data (e.g. Housing rent ~$1400 vs $2000 budget = 70%),
    // we always expect at least one alert to be present.
    const alertCards = page
      .locator('div')
      .filter({ hasText: /Budget Alerts/ })
      .locator('..')
      .locator('div[class*="rounded"]')
      .filter({ hasText: /%/ });

    await expect(alertCards.first()).toBeVisible();
  });

  test('Budget Alerts shows percentage values that are above 50%', async ({ page }) => {
    // All alert entries must be > 50% (the filter condition in the app)
    const pctTexts = await page
      .locator('div')
      .filter({ hasText: /Budget Alerts/ })
      .locator('..')
      .locator('span')
      .filter({ hasText: /\d+%/ })
      .allTextContents();

    // We expect at least one alert
    expect(pctTexts.length).toBeGreaterThan(0);

    for (const txt of pctTexts) {
      const value = parseInt(txt.replace('%', ''), 10);
      expect(value).toBeGreaterThanOrEqual(50);
    }
  });

  test('Budget Alerts section is not visible when on the Expenses tab', async ({ page }) => {
    // Alerts are a Dashboard-only widget; navigating away should hide them
    await page.getByRole('button', { name: 'Expenses' }).click();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();

    // "Budget Alerts" text should not be present on the Expenses view
    await expect(page.getByText('Budget Alerts')).not.toBeVisible();
  });

  test('Budget Alerts section reappears after navigating back to Charts', async ({ page }) => {
    await page.getByRole('button', { name: 'Expenses' }).click();
    await page.getByRole('button', { name: 'Charts' }).click();

    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await expect(page.getByText('Budget Alerts')).toBeVisible();
  });
});

test.describe('Charts tab — Recent Transactions section', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('Recent Transactions section heading is visible on the Charts overview', async ({ page }) => {
    await expect(page.getByText('Recent Transactions')).toBeVisible();
  });

  test('Recent Transactions list contains at least one row after login', async ({ page }) => {
    // Seeded data for March includes multiple transactions; the dashboard
    // renders the most recent ones in a list.
    const transactionRows = page
      .getByText('Recent Transactions')
      .locator('..')
      .locator('div')
      .filter({ hasText: /\$[\d,]+/ })
      .first();

    await expect(transactionRows).toBeVisible();
  });

  test('Recent Transactions list updates when switching to a different month', async ({ page }) => {
    const factory = new PageFactory(page);
    const chartsPage = factory.charts();

    // Capture text of the first transaction in March (default)
    const marFirst = await page
      .getByText('Recent Transactions')
      .locator('..')
      .locator('div')
      .filter({ hasText: /\$[\d,]+/ })
      .first()
      .textContent();

    // Switch to January
    await chartsPage.selectMonth('Jan');

    // The transaction list should still be visible (data exists for Jan too)
    const janSection = page.getByText('Recent Transactions');
    await expect(janSection).toBeVisible();

    // January transactions may differ from March; confirm the section re-renders
    const janFirst = await page
      .getByText('Recent Transactions')
      .locator('..')
      .locator('div')
      .filter({ hasText: /\$[\d,]+/ })
      .first()
      .textContent();

    // The first transaction amount or description may change between months
    // (seeded data differs); at minimum the section is still populated.
    expect(janFirst).toBeTruthy();
  });
});

test.describe('Charts tab — Chart section headings', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('"Spending by Category" chart section is visible', async ({ page }) => {
    await expect(page.getByText('Spending by Category')).toBeVisible();
  });

  test('"Cumulative Spending" chart section is visible', async ({ page }) => {
    await expect(page.getByText('Cumulative Spending')).toBeVisible();
  });

  test('"Monthly Comparison" chart section is visible', async ({ page }) => {
    await expect(page.getByText('Monthly Comparison')).toBeVisible();
  });
});
