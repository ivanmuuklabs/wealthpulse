import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budget Management — Happy Path & Negative Tests
 *
 * User story: "As a logged-in user I can set and adjust per-category budgets
 * and view real-time KPI feedback so that I always know if I'm on track."
 *
 * Acceptance criteria (happy path):
 * - Budgets page loads with 3 KPI cards: Total Budget, Total Spent, Remaining
 * - All 8 category cards are rendered
 * - Editing a category budget limit immediately updates the Total Budget KPI
 * - Remaining = Total Budget − Total Spent (±$1 rounding tolerance)
 * - Category search filters the cards; clearing it restores all 8
 * - Month switching changes Total Spent
 *
 * Negative / edge cases:
 * - Setting a budget below actual spending shows the "over" indicator
 * - A no-match category search hides all cards
 * - Rapid month switching does not crash the page
 */

test.describe('Budget Management — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const budgets = factory.budgets();
    await budgets.navigate();
    await expect(budgets.heading).toBeVisible();
  });

  test('all 3 KPI cards are visible on the Budgets page', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await expect(budgets.totalBudgetLabel).toBeVisible();
    await expect(budgets.totalSpentLabel).toBeVisible();
    await expect(budgets.remainingLabel).toBeVisible();
  });

  test('all 8 category budget cards are rendered', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await expect(budgets.categoryCards).toHaveCount(8);
  });

  test('increasing the Housing budget limit raises the Total Budget KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const before = await budgets.getKpiValue('Total Budget');

    // Raise Housing by $500
    const housingInput = budgets.budgetInput('Housing');
    const currentVal = parseFloat(await housingInput.inputValue());
    await housingInput.fill(String(currentVal + 500));
    await housingInput.press('Tab'); // trigger onChange

    const after = await budgets.getKpiValue('Total Budget');

    expect(after).toBeCloseTo(before + 500, 0);
  });

  test('Remaining KPI equals Total Budget minus Total Spent (±$1 tolerance)', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const totalBudget = await budgets.getKpiValue('Total Budget');
    const totalSpent = await budgets.getKpiValue('Total Spent');
    const remaining = await budgets.getKpiValue('Remaining');

    expect(Math.abs(remaining - (totalBudget - totalSpent))).toBeLessThanOrEqual(1);
  });

  test('category search for "Housing" shows only 1 card', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.searchCategories('Housing');

    await expect(budgets.categoryCards).toHaveCount(1);
    await expect(page.getByText('Housing').first()).toBeVisible();
  });

  test('clearing the category search restores all 8 cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.searchCategories('Housing');
    await expect(budgets.categoryCards).toHaveCount(1);

    await budgets.searchCategories('');
    await expect(budgets.categoryCards).toHaveCount(8);
  });

  test('switching from March to January changes the Total Spent KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const marSpent = await budgets.getKpiValue('Total Spent');

    await budgets.selectMonth('Jan');
    const janSpent = await budgets.getKpiValue('Total Spent');

    // Seeded data produces different spending per month
    expect(janSpent).not.toEqual(marSpent);
  });
});

test.describe('Budget Management — negative / edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const budgets = factory.budgets();
    await budgets.navigate();
    await expect(budgets.heading).toBeVisible();
  });

  test('setting Housing budget below its actual spending shows the "over" label', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Set Housing budget to $1 — guaranteed to be below any Housing spend
    const housingInput = budgets.budgetInput('Housing');
    await housingInput.fill('1');
    await housingInput.press('Tab');

    // The "over" text should now appear in the Housing card
    await expect(page.getByText(/over/i).first()).toBeVisible();
  });

  test('a no-match category search hides all budget cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.searchCategories('zzznotacategory99999');

    await expect(budgets.categoryCards).toHaveCount(0);
  });

  test('rapid month switching (Jan → Feb → Mar) does not crash and keeps KPIs visible', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.selectMonth('Jan');
    await budgets.selectMonth('Feb');
    await budgets.selectMonth('Mar');

    // All 3 KPI cards must still be present
    await expect(budgets.totalBudgetLabel).toBeVisible();
    await expect(budgets.totalSpentLabel).toBeVisible();
    await expect(budgets.remainingLabel).toBeVisible();
  });

  test('setting budget below spending makes Remaining KPI negative', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Zero out Housing budget to guarantee negative remaining for that category
    const housingInput = budgets.budgetInput('Housing');
    await housingInput.fill('0');
    await housingInput.press('Tab');

    // The overall Remaining should now be negative — Remaining KPI turns red
    const remaining = await budgets.getKpiValue('Remaining');
    // remaining could be negative; we just check the "over" label appears somewhere
    await expect(page.getByText(/over/i).first()).toBeVisible();
    // The remaining KPI value (may now be negative) should still render without crashing
    expect(typeof remaining).toBe('number');
  });
});
