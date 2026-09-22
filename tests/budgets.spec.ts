import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets tab — core flows
 *
 * The Budgets tab was completely untested by the tests already in this PR.
 * These tests cover:
 *   1. KPI cards render (Total Budget, Total Spent, Remaining)
 *   2. Edit budget limit (write path) — changing a category's spinbutton
 *      updates the Total Budget KPI
 *   3. Remaining KPI reflects Budget − Spent arithmetic
 *   4. Category search filters the budget cards
 *   5. Month switching changes Total Spent KPI
 */

test.describe('Budgets — core flows', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Budgets tab before each test
    await new PageFactory(page).budgets().navigate();
  });

  // ── Test 1 — KPI overview cards ─────────────────────────────────────────
  test('all three KPI cards (Total Budget, Total Spent, Remaining) are visible', async ({ page }) => {
    // The budgets tab renders an overview row with 3 stat cards.
    await expect(page.getByText('Total Budget')).toBeVisible();
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Remaining')).toBeVisible();
  });

  // ── Test 2 — Edit budget limit (write path) ──────────────────────────────
  test('increasing the Housing budget limit raises the Total Budget KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Parse current Total Budget value
    const parseDollar = (s: string | null) =>
      parseFloat((s ?? '0').replace(/[$,]/g, ''));

    const before = parseDollar(await budgets.getKpiValue('Total Budget'));

    // Set Housing budget to a known, higher value ($9999)
    await budgets.setBudgetLimit('Housing', 9999);

    const after = parseDollar(await budgets.getKpiValue('Total Budget'));

    // Total Budget must have increased
    expect(after).toBeGreaterThan(before);
  });

  // ── Test 3 — Remaining = Budget − Spent ─────────────────────────────────
  test('Remaining KPI equals Total Budget minus Total Spent (±$1 tolerance)', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const parseDollar = (s: string | null) =>
      parseFloat((s ?? '0').replace(/[$,]/g, ''));

    const totalBudget = parseDollar(await budgets.getKpiValue('Total Budget'));
    const totalSpent = parseDollar(await budgets.getKpiValue('Total Spent'));
    const remaining = parseDollar(await budgets.getKpiValue('Remaining'));

    // Allow $1 rounding tolerance
    expect(Math.abs(remaining - (totalBudget - totalSpent))).toBeLessThanOrEqual(1);
  });

  // ── Test 4 — Category search filters cards ───────────────────────────────
  test('searching for "Housing" shows only the Housing card', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.searchCategory('Housing');

    // The Housing card should be visible
    await expect(page.getByText('Housing').first()).toBeVisible();

    // Other categories should not be visible
    await expect(page.getByText('Food').first()).not.toBeVisible();
    await expect(page.getByText('Transport').first()).not.toBeVisible();
  });

  // ── Test 5 — Category search clear restores all cards ────────────────────
  test('clearing the category search restores all 8 category cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Filter to one category, then clear
    await budgets.searchCategory('Food');
    await budgets.clearSearch();

    // All categories should be visible again
    const categories = ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Shopping', 'Subscriptions'];
    for (const cat of categories) {
      await expect(page.getByText(cat).first()).toBeVisible();
    }
  });

  // ── Test 6 — Month switching changes Total Spent ─────────────────────────
  test('switching from March to January changes the Total Spent KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const parseDollar = (s: string | null) =>
      parseFloat((s ?? '0').replace(/[$,]/g, ''));

    // App defaults to March — read Total Spent
    const marSpent = parseDollar(await budgets.getKpiValue('Total Spent'));

    // Switch to January
    await budgets.selectMonth('Jan');

    const janSpent = parseDollar(await budgets.getKpiValue('Total Spent'));

    // Seeded data produces different spending per month
    expect(janSpent).not.toBeCloseTo(marSpent, 0);
  });
});
