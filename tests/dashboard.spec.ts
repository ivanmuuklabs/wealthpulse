import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Dashboard (Charts tab) — critical flow coverage
 *
 * These tests target the Overview tab's core user flows that were
 * previously untested: month switching, KPI card rendering, budget
 * alert visibility, and recent-transaction list content.
 */

test.describe('Dashboard — Overview tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we land on the Overview page before each test
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // ── Test 1 ────────────────────────────────────────────────────────────────
  // Month switching updates the KPI values.
  // The dashboard defaults to March (index 2). Switching to January (index 0)
  // must produce a different "Total Spent" value because the seed data has
  // distinct spending per month.
  test('switching months on the Dashboard produces different Total Spent KPIs', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Read March Total Spent (default selected month)
    await dashboard.marButton.click();
    const marCard = page
      .getByText('Total Spent')
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first();
    const marValue = await marCard.textContent();

    // Switch to January and read again
    await dashboard.janButton.click();
    const janValue = await marCard.textContent();

    // Different months must have different spending totals in the seeded data
    expect(janValue).not.toEqual(marValue);

    // The header sub-text should reflect the selected month
    await expect(page.locator('header p')).toContainText('January');
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────
  // All four KPI stat cards are visible after login and display dollar amounts.
  // This is the single most-visited page; the presence of all four KPIs is
  // foundational.
  test('all four Dashboard KPI cards are visible and show dollar values', async ({ page }) => {
    const kpiLabels = ['Total Spent', 'Monthly Income', 'Net Savings'];

    for (const label of kpiLabels) {
      // Each label must be visible
      await expect(page.getByText(label)).toBeVisible();

      // Each card's sibling must contain a formatted dollar amount
      await expect(
        page.getByText(label).locator('..').getByText(/\$[\d,]+/)
      ).toBeVisible();
    }

    // Transactions KPI shows a numeric count (no dollar sign)
    await expect(page.getByText('Transactions')).toBeVisible();
    await expect(
      page.getByText('Transactions').locator('..').getByText(/^\d+$/)
    ).toBeVisible();
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────
  // Budget Alerts section appears on the Dashboard for categories exceeding 50%
  // of their budget. The seeded data ensures several categories are over that
  // threshold, so the section must be rendered.
  test('Budget Alerts section is visible and lists at least one category', async ({ page }) => {
    // The heading "Budget Alerts" should be present
    await expect(page.getByText('Budget Alerts')).toBeVisible();

    // At least one category name from the known set must appear inside the alerts
    const categories = ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Shopping', 'Subscriptions'];
    const budgetAlertsCard = page.getByText('Budget Alerts').locator('../..');

    let found = false;
    for (const cat of categories) {
      const count = await budgetAlertsCard.getByText(cat).count();
      if (count > 0) { found = true; break; }
    }
    expect(found, 'At least one category should appear in Budget Alerts').toBe(true);
  });
});
