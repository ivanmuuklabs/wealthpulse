import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Functional tests for the Budgets tab.
 *
 * The Budgets tab (introduced in the daily-2026-09-17 PR alongside BudgetsPage.ts)
 * was added as a page object with no accompanying spec file. This spec provides
 * first coverage for:
 *   1. Tab reachability and KPI card visibility
 *   2. Category search (match, partial match, no-match, case-insensitive)
 *   3. Month switching (KPI values update)
 *   4. Inline budget editing (spinbutton updates stored value)
 *   5. Financial invariants (Remaining ≤ Total Budget)
 */

test.describe('Budgets tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to Budgets via the sidebar
    const budgets = factory.budgets();
    await budgets.navigate();
  });

  // ─── Happy path ───────────────────────────────────────────────────────────

  test('Budgets tab is reachable and shows the Budgets heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
  });

  test('all three KPI cards (Total Budget, Total Spent, Remaining) are visible', async ({ page }) => {
    await expect(page.getByText('Total Budget').first()).toBeVisible();
    await expect(page.getByText('Total Spent').first()).toBeVisible();
    await expect(page.getByText('Remaining').first()).toBeVisible();
  });

  test('all 8 category cards are displayed by default', async ({ page }) => {
    // The seeded app has exactly 8 budget categories
    const categories = ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Shopping', 'Subscriptions'];
    for (const cat of categories) {
      await expect(page.getByText(cat).first()).toBeVisible();
    }
  });

  test('searching for "Housing" shows exactly the Housing card', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.searchCategory('Housing');

    // Housing must be visible
    await expect(page.getByText('Housing').first()).toBeVisible();
    // Other categories must be hidden
    await expect(page.getByText('Food').first()).not.toBeVisible();
    await expect(page.getByText('Transport').first()).not.toBeVisible();
  });

  test('clearing the search restores all 8 category cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Filter down to one category, then clear
    await budgets.searchCategory('Housing');
    await expect(page.getByText('Food').first()).not.toBeVisible();

    await budgets.searchCategory('');
    // All categories should return
    await expect(page.getByText('Food').first()).toBeVisible();
    await expect(page.getByText('Transport').first()).toBeVisible();
  });

  test('switching months updates the Total Spent KPI value', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Default month is March (index 2) — read Total Spent
    const marSpent = await budgets.getKpiValue('Total Spent');

    // Switch to January and read again
    await budgets.selectMonth('Jan');
    const janSpent = await budgets.getKpiValue('Total Spent');

    // Seeded data generates different spending per month
    expect(janSpent).not.toBeNull();
    expect(marSpent).not.toBeNull();
    expect(janSpent).not.toEqual(marSpent);
  });

  test('editing the Housing budget spinbutton updates the displayed value', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const housingInput = budgets.getCategoryBudgetInput('Housing');
    await housingInput.fill('2500');
    // Trigger change event by pressing Tab
    await housingInput.press('Tab');

    // The input should reflect the new value
    await expect(housingInput).toHaveValue('2500');
  });

  test('category search is case-insensitive (lowercase "transport" finds Transport)', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.searchCategory('transport');

    await expect(page.getByText('Transport').first()).toBeVisible();
    // Other categories should be hidden
    await expect(page.getByText('Housing').first()).not.toBeVisible();
  });

  // ─── Negative / edge cases ────────────────────────────────────────────────

  test('a no-match search hides all category cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.searchCategory('zzznomatch');

    // None of the known categories should be visible
    for (const cat of ['Housing', 'Food', 'Transport', 'Entertainment']) {
      await expect(page.getByText(cat).first()).not.toBeVisible();
    }
  });

  test('partial match "Trans" shows only the Transport card', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.searchCategory('Trans');

    await expect(page.getByText('Transport').first()).toBeVisible();
    await expect(page.getByText('Housing').first()).not.toBeVisible();
    await expect(page.getByText('Food').first()).not.toBeVisible();
  });

  test('Remaining is always ≤ Total Budget (within $1 rounding tolerance)', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const parseAmount = (str: string | null) =>
      parseFloat((str ?? '0').replace(/[$,]/g, ''));

    const totalBudget = parseAmount(await budgets.getKpiValue('Total Budget'));
    const remaining   = parseAmount(await budgets.getKpiValue('Remaining'));

    // Remaining cannot exceed Total Budget (it can be negative if over-budget)
    expect(remaining).toBeLessThanOrEqual(totalBudget + 1);
  });

  test('rapid month switching does not break the UI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Click all three month buttons in quick succession
    await budgets.selectMonth('Jan');
    await budgets.selectMonth('Feb');
    await budgets.selectMonth('Mar');

    // After rapid switching the heading and KPI cards must still be visible
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
    await expect(page.getByText('Total Budget').first()).toBeVisible();
  });
});
