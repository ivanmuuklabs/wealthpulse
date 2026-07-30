import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  // Dashboard is the default landing page after login
});

// ─── Recent Transactions ──────────────────────────────────────────────────────

// The dashboard shows a "Recent Transactions" card with up to 8 rows for the
// active month.  Each row must display a description and a red amount.
test('Dashboard shows up to 8 recent transactions for the selected month', async ({ page }) => {
  // March is the default selected month (index 2)
  const heading = page.locator('h3').filter({ hasText: /recent transactions/i });
  await expect(heading).toBeVisible();

  // Each transaction row contains a negative dollar amount (e.g. -$42.00)
  const rows = page
    .locator('div')
    .filter({ hasText: /^-\$/ })
    .or(page.locator('.space-y-1 > div').filter({ hasText: /\-\$/ }));

  // The section is rendered; at least one row should be visible
  await expect(rows.first()).toBeVisible();

  // The app caps the list at 8 rows
  const count = await page
    .locator('.space-y-1 > div')
    .filter({ hasText: /\-\$/ })
    .count();
  expect(count).toBeGreaterThanOrEqual(1);
  expect(count).toBeLessThanOrEqual(8);
});

// Switching months also refreshes the Recent Transactions list
test('Recent Transactions list refreshes when switching months', async ({ page }) => {
  const dashboard = new PageFactory(page).dashboard();

  // Capture the first transaction description in March (default)
  const marchFirstDesc = await page
    .locator('.space-y-1 > div')
    .filter({ hasText: /\-\$/ })
    .first()
    .locator('p.text-white')
    .textContent();

  // Switch to January — the transaction list should reload
  await dashboard.selectMonth('Jan');

  // The heading remains visible after the switch
  await expect(page.locator('h3').filter({ hasText: /recent transactions/i })).toBeVisible();

  // Switch back to March and verify the first transaction description is restored
  await dashboard.selectMonth('Mar');
  const marchAgainDesc = await page
    .locator('.space-y-1 > div')
    .filter({ hasText: /\-\$/ })
    .first()
    .locator('p.text-white')
    .textContent();

  expect(marchAgainDesc).toBe(marchFirstDesc);
});

// ─── Budget Alerts ────────────────────────────────────────────────────────────

// The app renders a "Budget Alerts" card whenever at least one category has
// used more than 50 % of its monthly budget.  With the seeded data for March
// this card should always appear.
test('Budget Alerts card is visible and lists over-budget categories', async ({ page }) => {
  // The card heading
  const alertsHeading = page.locator('h3').filter({ hasText: /budget alerts/i });
  await expect(alertsHeading).toBeVisible();

  // Each alert row shows a category name, a "spent / budget" value pair, and a
  // coloured progress bar.  The amount text follows the pattern "$X.XX / $Y.YY".
  const alertRows = page.locator('div').filter({ hasText: /\$[\d,.]+\s*\/\s*\$[\d,.]+/ });
  await expect(alertRows.first()).toBeVisible();

  // There should be at least one alert row
  const rowCount = await alertRows.count();
  expect(rowCount).toBeGreaterThanOrEqual(1);
});

// Switching to January (which has fresh seeded data) should also show alerts
test('Budget Alerts are present after switching to January', async ({ page }) => {
  const dashboard = new PageFactory(page).dashboard();
  await dashboard.selectMonth('Jan');

  // At minimum the KPI cards should still render
  await expect(dashboard.totalSpentCard).toBeVisible();

  // If any category exceeded 50 % of budget the alerts card appears
  // (seeded data ensures this); verify the heading is present
  const alertsHeading = page.locator('h3').filter({ hasText: /budget alerts/i });
  await expect(alertsHeading).toBeVisible();
});
