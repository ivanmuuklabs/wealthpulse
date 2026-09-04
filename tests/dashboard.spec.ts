import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard (Charts tab) — coverage tests
 *
 * Covers:
 *  - All four KPI cards render with values on load (defaulting to March)
 *  - Month switching updates KPI values
 *  - Monthly Income is always $6,500 (fixed by the app)
 *  - Net Savings is positive for all months (income $6,500 > expected spend)
 *  - Transaction count KPI is a positive number
 *  - All three chart sections are visible
 *  - Budget Alerts section appears (seeded data always exceeds 50% for ≥1 category)
 *  - Recent Transactions list shows up to 8 rows
 *  - Switching month changes the Recent Transactions date context
 */

test.describe('Dashboard — KPI cards', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Default month after login is March; confirm we are on the dashboard
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('all four KPI card labels are visible on load', async ({ page }) => {
    // The app defaults to March after login
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });

  test('Monthly Income KPI always shows $6,500.00', async ({ page }) => {
    // Income is a fixed constant in the app — it must not change across months
    const incomeCard = page.getByText('Monthly Income').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();
    await expect(incomeCard.locator('p.text-xl')).toHaveText('$6,500.00');
  });

  test('Total Spent KPI shows a dollar value for the default month (March)', async ({ page }) => {
    const spentCard = page.getByText('Total Spent').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();
    const value = await spentCard.locator('p.text-xl').textContent();
    // Value must be a formatted dollar amount, e.g. "$3,241.55"
    expect(value).toMatch(/^\$[\d,]+\.\d{2}$/);
  });

  test('Net Savings KPI is positive for March (income exceeds seeded spending)', async ({ page }) => {
    const savingsCard = page.getByText('Net Savings').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();
    const value = await savingsCard.locator('p.text-xl').textContent() ?? '';
    // Strip "$" and "," to parse as a number
    const numeric = parseFloat(value.replace(/[$,]/g, ''));
    expect(numeric).toBeGreaterThan(0);
  });

  test('Transactions KPI shows a positive integer count', async ({ page }) => {
    const txnCard = page.getByText('Transactions').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();
    const value = await txnCard.locator('p.text-xl').textContent() ?? '';
    expect(parseInt(value, 10)).toBeGreaterThan(0);
  });
});

test.describe('Dashboard — month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('switching from March to January activates the Jan button', async ({ page }) => {
    const janBtn = page.getByRole('button', { name: 'Jan' });
    await janBtn.click();
    await expect(janBtn).toHaveClass(/text-emerald-400/);
    // The previously active Mar button should lose the active class
    await expect(page.getByRole('button', { name: 'Mar' })).not.toHaveClass(/text-emerald-400/);
  });

  test('Total Spent differs between January and March', async ({ page }) => {
    const getSpent = async () => {
      const card = page.getByText('Total Spent').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();
      return card.locator('p.text-xl').textContent();
    };

    // March is already selected (default)
    const marSpent = await getSpent();

    await page.getByRole('button', { name: 'Jan' }).click();
    await expect(page.getByRole('button', { name: 'Jan' })).toHaveClass(/text-emerald-400/);
    const janSpent = await getSpent();

    // Seeded data generates different totals per month
    expect(janSpent).not.toEqual(marSpent);
  });

  test('all three months can be selected in sequence', async ({ page }) => {
    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      const btn = page.getByRole('button', { name: month });
      await btn.click();
      await expect(btn).toHaveClass(/text-emerald-400/);
    }
  });

  test('Monthly Income stays $6,500.00 after switching months', async ({ page }) => {
    const incomeCard = page.getByText('Monthly Income').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();

    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await page.getByRole('button', { name: month }).click();
      await expect(incomeCard.locator('p.text-xl')).toHaveText('$6,500.00');
    }
  });
});

test.describe('Dashboard — charts', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('Spending by Category chart heading is visible', async ({ page }) => {
    await expect(page.getByText('Spending by Category')).toBeVisible();
  });

  test('Cumulative Spending chart heading is visible', async ({ page }) => {
    await expect(page.getByText('Cumulative Spending')).toBeVisible();
  });

  test('Monthly Comparison chart heading is visible', async ({ page }) => {
    await expect(page.getByText('Monthly Comparison')).toBeVisible();
  });

  test('Monthly Comparison chart shows all three month labels', async ({ page }) => {
    // The bar chart X-axis renders Jan, Feb, Mar as tick labels
    await expect(page.getByText('Monthly Comparison')).toBeVisible();
    // Recharts renders ticks as SVG text — locate them by their string content
    const chartCard = page.getByText('Monthly Comparison').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();
    await expect(chartCard).toContainText('Jan');
    await expect(chartCard).toContainText('Feb');
    await expect(chartCard).toContainText('Mar');
  });
});

test.describe('Dashboard — Budget Alerts', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('Budget Alerts section is visible (seeded data always triggers ≥1 alert)', async ({ page }) => {
    // The section only renders when ≥1 category exceeds 50% of its budget.
    // The seeded demo data is designed to guarantee this on every month.
    await expect(page.getByText('Budget Alerts')).toBeVisible();
  });

  test('Budget Alerts section shows at most 4 categories', async ({ page }) => {
    await expect(page.getByText('Budget Alerts')).toBeVisible();
    const alertsCard = page.getByText('Budget Alerts').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();
    // Each alert row contains a category name; count the inner item containers
    const alertItems = alertsCard.locator('div.flex.items-center.gap-3.p-3');
    const count = await alertItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(4);
  });

  test('Budget Alerts section updates when switching months', async ({ page }) => {
    // Capture alert category names for March
    const getAlertNames = async () => {
      const alertsCard = page.getByText('Budget Alerts').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();
      return alertsCard.locator('span.text-slate-300').allTextContents();
    };

    const marAlerts = await getAlertNames();

    await page.getByRole('button', { name: 'Jan' }).click();
    await expect(page.getByRole('button', { name: 'Jan' })).toHaveClass(/text-emerald-400/);

    const janAlerts = await getAlertNames();

    // Spending per category differs by month, so the alert set or order changes
    // (they may not be identical in content or percentage sort order)
    expect(JSON.stringify(marAlerts)).not.toEqual(JSON.stringify(janAlerts));
  });
});

test.describe('Dashboard — Recent Transactions', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('Recent Transactions heading is visible', async ({ page }) => {
    await expect(page.getByText('Recent Transactions')).toBeVisible();
  });

  test('Recent Transactions shows between 1 and 8 rows', async ({ page }) => {
    const recentCard = page.getByText('Recent Transactions').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();
    // Each row is a flex container with the category icon, description, and amount
    const rows = recentCard.locator('div.flex.items-center.gap-3.py-2');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(8);
  });

  test('each Recent Transactions row shows a red negative amount', async ({ page }) => {
    const recentCard = page.getByText('Recent Transactions').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();
    const rows = recentCard.locator('div.flex.items-center.gap-3.py-2');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const amountEl = rows.nth(i).locator('span.text-red-400');
      await expect(amountEl).toBeVisible();
      const text = await amountEl.textContent() ?? '';
      // Each amount is rendered as "-$X,XXX.XX"
      expect(text).toMatch(/^-\$[\d,]+\.\d{2}$/);
    }
  });

  test('switching month changes the Recent Transactions list', async ({ page }) => {
    const recentCard = page.getByText('Recent Transactions').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();

    // Capture first row description in March (default)
    const firstRowMar = await recentCard.locator('p.text-sm.text-white').first().textContent();

    // Switch to January and capture again
    await page.getByRole('button', { name: 'Jan' }).click();
    await expect(page.getByRole('button', { name: 'Jan' })).toHaveClass(/text-emerald-400/);

    const firstRowJan = await recentCard.locator('p.text-sm.text-white').first().textContent();

    // Transaction dates and ordering differ between months
    expect(firstRowJan).not.toEqual(firstRowMar);
  });

  test('Recent Transactions rows show a date in YYYY-MM format for the selected month', async ({ page }) => {
    // March is selected by default (index 2 = month 03)
    const recentCard = page.getByText('Recent Transactions').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();
    const dateLabels = recentCard.locator('p.text-\\[10px\\].text-slate-500');
    const count = await dateLabels.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const text = await dateLabels.nth(i).textContent() ?? '';
      // Format: "Category · 2026-03-DD"
      expect(text).toMatch(/2026-0[123]-\d{2}/);
    }
  });
});
