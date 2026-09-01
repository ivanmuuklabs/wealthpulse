import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Supplementary Dashboard tests added by Amikoo to close coverage gaps
 * identified in PR #9 (sidebar rename + KPI order swap):
 *
 *  1. Net Savings = Monthly Income − Total Spent (sanity-checks the KPI maths)
 *  2. Dashboard charts section renders (donut, cumulative area, monthly bar)
 *  3. Budget Alerts section renders when categories are over 50 % of budget
 *  4. Collapsed sidebar — "Reports" button still navigates correctly
 *  5. Top-bar title shows the internal route id ("dashboard") while sidebar
 *     label shows the display name "Reports" — both must be true simultaneously
 */

test.describe('Dashboard — supplementary coverage', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // After login the user lands on the Dashboard/Overview
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // ──────────────────────────────────────────────
  // 1 — Net Savings KPI value = Monthly Income − Total Spent
  // ──────────────────────────────────────────────
  test('Net Savings KPI equals Monthly Income minus Total Spent', async ({ page }) => {
    const parseUSD = (text: string | null) =>
      parseFloat((text ?? '0').replace(/[$,]/g, ''));

    // Read the KPI values from the DOM
    const totalSpentText = await page
      .getByText('Total Spent')
      .locator('../..')
      .locator('p.text-xl')
      .textContent();

    const monthlyIncomeText = await page
      .getByText('Monthly Income')
      .locator('../..')
      .locator('p.text-xl')
      .textContent();

    const netSavingsText = await page
      .getByText('Net Savings')
      .locator('../..')
      .locator('p.text-xl')
      .textContent();

    const totalSpent = parseUSD(totalSpentText);
    const monthlyIncome = parseUSD(monthlyIncomeText);
    const netSavings = parseUSD(netSavingsText);

    // Allow $1 rounding tolerance from display formatting
    expect(Math.abs(netSavings - (monthlyIncome - totalSpent))).toBeLessThanOrEqual(1);
  });

  // ──────────────────────────────────────────────
  // 2 — Dashboard charts section is visible after login
  // ──────────────────────────────────────────────
  test('Spending by Category chart heading is visible on the Dashboard', async ({ page }) => {
    await expect(page.getByText('Spending by Category')).toBeVisible();
  });

  test('Cumulative Spending chart heading is visible on the Dashboard', async ({ page }) => {
    await expect(page.getByText('Cumulative Spending')).toBeVisible();
  });

  test('Monthly Comparison chart heading is visible on the Dashboard', async ({ page }) => {
    await expect(page.getByText('Monthly Comparison')).toBeVisible();
  });

  // ──────────────────────────────────────────────
  // 3 — Budget Alerts section renders (seeded data keeps multiple categories
  //     above 50 % of their budget limits, so this section is always shown)
  // ──────────────────────────────────────────────
  test('Budget Alerts section is present on the Dashboard Overview', async ({ page }) => {
    await expect(page.getByText('Budget Alerts')).toBeVisible();
  });

  // ──────────────────────────────────────────────
  // 4 — Collapsed sidebar — "Reports" button still navigates
  // ──────────────────────────────────────────────
  test('sidebar collapse hides the "Reports" label but the button still navigates', async ({ page }) => {
    // Navigate away first so we can confirm navigation back works
    await page.getByRole('button', { name: /expenses/i }).click();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();

    // Collapse the sidebar
    await page.getByRole('button', { name: /collapse/i }).click();

    // After collapse the "Reports" text label should not be visible
    await expect(page.getByRole('button', { name: /reports/i })).not.toContainText('Reports');

    // Clicking the icon-only button still navigates back to the Overview
    await page.getByRole('button', { name: /reports/i }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // ──────────────────────────────────────────────
  // 5 — Top-bar title and sidebar label are in sync
  //     The top bar uses the internal route id ("dashboard") while the sidebar
  //     button carries the display label "Reports".  Both must be true at once.
  // ──────────────────────────────────────────────
  test('top-bar shows "dashboard" route id while sidebar shows "Reports" display label', async ({ page }) => {
    // Sidebar button label is the display name
    await expect(page.getByRole('button', { name: /reports/i })).toBeVisible();

    // Top-bar title is the internal route id — lowercase "dashboard"
    await expect(page.locator('header h1')).toHaveText('dashboard');
  });
});
