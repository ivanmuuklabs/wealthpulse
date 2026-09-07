import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

// Budgets happy-path tests
// Covers: edit budget limit inline, search categories, switch month, KPI card math

test.describe('Budgets — happy path', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const budgets = factory.budgets();
    await budgets.navigate();
  });

  test('Budgets tab renders the three KPI summary cards', async ({ page }) => {
    // All three summary cards must be visible on load
    await expect(page.getByText('Total Budget')).toBeVisible();
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Remaining')).toBeVisible();
  });

  test('switching to February shows different Total Spent than January', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read January Total Spent
    await budgets.selectMonth('Jan');
    const janSpent = await budgets.getKpiValue(budgets.totalSpentCard);

    // Switch to February and read again
    await budgets.selectMonth('Feb');
    const febSpent = await budgets.getKpiValue(budgets.totalSpentCard);

    // The seeded demo data produces different spending totals per month
    expect(janSpent).not.toEqual(febSpent);
    // Both values must be positive numbers
    expect(janSpent).toBeGreaterThan(0);
    expect(febSpent).toBeGreaterThan(0);
  });

  test('Remaining KPI equals Total Budget minus Total Spent', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.selectMonth('Jan');

    const budget    = await budgets.getKpiValue(budgets.totalBudgetCard);
    const spent     = await budgets.getKpiValue(budgets.totalSpentCard);
    const remaining = await budgets.getKpiValue(budgets.remainingCard);

    // Allow $1 rounding tolerance from floating-point display
    expect(Math.abs(remaining - (budget - spent))).toBeLessThanOrEqual(1);
  });

  test('editing the Housing budget limit recalculates Total Budget KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.selectMonth('Jan');

    // Read the current Total Budget
    const before = await budgets.getKpiValue(budgets.totalBudgetCard);

    // Increase Housing budget by $500
    await budgets.setBudgetLimit('Housing', 2000);

    // Total Budget should have changed
    const after = await budgets.getKpiValue(budgets.totalBudgetCard);
    expect(after).not.toEqual(before);
    expect(after).toBeGreaterThan(0);
  });

  test('searching a category name shows only matching budget cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Search for "Food" — only Food budget card should remain visible
    await budgets.searchCategory('Food');

    await expect(page.getByText('Food')).toBeVisible();
    // "Housing" should no longer be visible (it doesn't match "Food")
    await expect(page.getByText('Housing')).not.toBeVisible();
  });

  test('searching for a non-existent category shows no budget cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.searchCategory('zzznotacategory');

    // None of the known categories should be visible
    await expect(page.getByText('Housing')).not.toBeVisible();
    await expect(page.getByText('Food')).not.toBeVisible();
  });

  test('budget limits are the same across January and March', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // The Budgets module description states limits remain unchanged across months
    const getHousingLimit = async (month: 'Jan' | 'Mar') => {
      await budgets.selectMonth(month);
      return page
        .locator('div')
        .filter({ hasText: /^Housing/ })
        .first()
        .locator('input[type="number"]')
        .inputValue();
    };

    const janLimit = await getHousingLimit('Jan');
    const marLimit = await getHousingLimit('Mar');

    expect(janLimit).toEqual(marLimit);
  });

});
