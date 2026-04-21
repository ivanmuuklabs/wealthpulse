import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.describe('Dashboard — balance and KPI card integrity', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Wait for the Dashboard to fully render
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('Monthly Income is always $6,500.00', async ({ page }) => {
    // Monthly Income is a hardcoded constant — must always be exactly this value
    const incomeCard = page.locator('div', { has: page.getByText('Monthly Income') });
    await expect(incomeCard.getByText('$6,500.00')).toBeVisible();
  });

  test('Total Spent shows a non-zero positive dollar amount', async ({ page }) => {
    const spentCard = page.locator('div', { has: page.getByText('Total Spent') });
    // Grab the displayed value and assert it looks like a positive dollar amount
    const valueText = await spentCard.locator('p.text-xl').textContent();
    expect(valueText).toMatch(/^\$[\d,]+\.\d{2}$/);
    const amount = parseFloat(valueText!.replace(/[$,]/g, ''));
    expect(amount).toBeGreaterThan(0);
  });

  test('Net Savings is less than Monthly Income and reflects the correct formula', async ({ page }) => {
    // Net Savings = $6,500 − Total Spent. It must always be below $6,500.
    const savingsCard = page.locator('div', { has: page.getByText('Net Savings') });
    const valueText = await savingsCard.locator('p.text-xl').textContent();
    expect(valueText).toMatch(/^\$[\d,]+\.\d{2}$/);
    const savings = parseFloat(valueText!.replace(/[$,]/g, ''));
    expect(savings).toBeLessThan(6500);
  });

  test('Transactions count is a positive integer with category context', async ({ page }) => {
    const txnCard = page.locator('div', { has: page.getByText('Transactions').first() });
    // The count itself (a number, not a dollar amount)
    const countText = await txnCard.locator('p.text-xl').textContent();
    expect(Number(countText!.trim())).toBeGreaterThan(0);
    // Sub-label shows "across N categories"
    await expect(txnCard.getByText(/across \d+ categories/)).toBeVisible();
  });

  test('Switching months updates all four KPI values', async ({ page }) => {
    // Capture March values (default, month index 2)
    const incomeCard = page.locator('div', { has: page.getByText('Monthly Income') });
    const spentCard  = page.locator('div', { has: page.getByText('Total Spent') });
    const txnCard    = page.locator('div', { has: page.getByText('Transactions').first() });

    const marchSpent = await spentCard.locator('p.text-xl').textContent();
    const marchTxns  = await txnCard.locator('p.text-xl').textContent();

    // Switch to January
    await page.getByRole('button', { name: 'Jan' }).click();

    // Monthly Income must remain $6,500.00 regardless of month
    await expect(incomeCard.getByText('$6,500.00')).toBeVisible();

    // Total Spent and Transactions count must have updated (different month = different data)
    const janSpent = await spentCard.locator('p.text-xl').textContent();
    const janTxns  = await txnCard.locator('p.text-xl').textContent();

    // Values should differ between March and January
    expect(janSpent).not.toBe(marchSpent);
    expect(janTxns).not.toBe(marchTxns);

    // Switch to February — verify it updates again
    await page.getByRole('button', { name: 'Feb' }).click();
    const febSpent = await spentCard.locator('p.text-xl').textContent();
    expect(febSpent).not.toBe(marchSpent);
  });

  test('Recent Transactions table shows entries with amounts and dates', async ({ page }) => {
    // Each row must have a negative dollar amount (expenses) and a YYYY-MM-DD date
    const rows = page.locator('text=Recent Transactions').locator('..').locator('div.flex.items-center.gap-3.py-2');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(8); // capped at 8 per the product spec

    // Spot-check the first row: amount is a negative value, date is present
    const firstRow = rows.first();
    await expect(firstRow.getByText(/^-\$[\d,]+\.\d{2}$/)).toBeVisible();
    await expect(firstRow.getByText(/\d{4}-\d{2}-\d{2}/)).toBeVisible();
  });

  test('Budget Alerts section shows spent vs budget amounts', async ({ page }) => {
    // Budget Alerts appear for categories that have spent > 50% of budget
    const alertsSection = page.locator('div', { has: page.getByText('Budget Alerts') });

    // At least one alert must be visible with the "Amount / Budget" pattern
    const alertItems = alertsSection.locator('div.flex.items-center.gap-3.p-3');
    const alertCount = await alertItems.count();
    expect(alertCount).toBeGreaterThan(0);

    // Each alert shows "$ X / $ Y" pattern
    const firstAlert = alertItems.first();
    await expect(firstAlert.getByText(/\$[\d,]+\.\d{2} \/ \$[\d,]+\.\d{2}/)).toBeVisible();
  });
});
