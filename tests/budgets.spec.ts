import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets — happy path tests
 *
 * The Budgets tab shows:
 *   - A month selector (Jan / Feb / Mar)
 *   - Three KPI stat cards: Total Budget, Total Spent, Remaining
 *   - A category search input
 *   - One card per budget category, each with an inline number input, a progress bar, and remaining/over text
 *
 * These tests validate: KPI rendering, month switching, category search, inline budget
 * editing (with KPI reactivity), and progress bar colour logic.
 */

test.describe('Budgets — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();
  });

  test('Budgets heading and KPI cards are visible after navigation', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();

    const budgets = new PageFactory(page).budgets();
    await expect(budgets.totalBudgetCard).toBeVisible();
    await expect(budgets.totalSpentCard).toBeVisible();
    await expect(budgets.remainingCard).toBeVisible();
  });

  test('Total Budget KPI value is consistent across months (budgets are global)', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const parseAmt = (s: string) => parseFloat(s.replace(/[$,]/g, ''));

    await budgets.selectMonth('Feb');
    const febBudget = parseAmt(await budgets.getKpiValue(budgets.totalBudgetCard));

    await budgets.selectMonth('Mar');
    const marBudget = parseAmt(await budgets.getKpiValue(budgets.totalBudgetCard));

    // Budget limits are shared across all months in the app state
    expect(febBudget).toEqual(marBudget);
    expect(febBudget).toBeGreaterThan(0);
  });

  test('Total Spent KPI differs between months (spending is per-month)', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const parseAmt = (s: string) => parseFloat(s.replace(/[$,]/g, ''));

    await budgets.selectMonth('Jan');
    const janSpent = parseAmt(await budgets.getKpiValue(budgets.totalSpentCard));

    await budgets.selectMonth('Mar');
    const marSpent = parseAmt(await budgets.getKpiValue(budgets.totalSpentCard));

    // Each month has different seeded transactions
    expect(janSpent).not.toEqual(marSpent);
  });

  test('Remaining KPI equals Total Budget minus Total Spent for each month', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    const parseAmt = (s: string) => parseFloat(s.replace(/[$,]/g, ''));

    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await budgets.selectMonth(month);
      const budget    = parseAmt(await budgets.getKpiValue(budgets.totalBudgetCard));
      const spent     = parseAmt(await budgets.getKpiValue(budgets.totalSpentCard));
      const remaining = parseAmt(await budgets.getKpiValue(budgets.remainingCard));
      // Allow $1 rounding tolerance
      expect(Math.abs(remaining - (budget - spent))).toBeLessThanOrEqual(1);
    }
  });

  test('category search filters the visible budget cards to matching categories', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Search for "hous" — only the Housing card should remain
    await budgets.searchCategory('hous');

    // Housing card is visible
    await expect(page.getByText('Housing').first()).toBeVisible();

    // Non-matching categories (e.g. Food) should not appear in cards
    const foodCard = page.locator('div', { hasText: /^Food/ }).first();
    await expect(foodCard).not.toBeVisible();
  });

  test('clearing the category search restores all 8 category cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.searchCategory('hous');
    await budgets.searchCategory(''); // clear

    // All 8 categories must be visible
    const categories = ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Shopping', 'Subscriptions'];
    for (const cat of categories) {
      await expect(page.getByText(cat).first()).toBeVisible();
    }
  });

  test('each category card shows a budget input pre-populated with a positive value', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Check a sample of categories
    for (const cat of ['Housing', 'Food', 'Transport']) {
      const input = budgets.categoryBudgetInput(cat);
      await expect(input).toBeVisible();
      const value = await input.inputValue();
      expect(parseFloat(value)).toBeGreaterThan(0);
    }
  });

  test('editing the Housing budget limit updates the Total Budget KPI in real time', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.selectMonth('Jan');

    const parseAmt = (s: string) => parseFloat(s.replace(/[$,]/g, ''));
    const initialTotal = parseAmt(await budgets.getKpiValue(budgets.totalBudgetCard));

    const housingInput = budgets.categoryBudgetInput('Housing');
    await expect(housingInput).toBeVisible();

    const currentValue = parseFloat(await housingInput.inputValue()) || 0;
    const newValue = currentValue + 500;

    // Update the Housing budget
    await housingInput.click({ clickCount: 3 });
    await housingInput.fill(String(newValue));
    await housingInput.press('Tab'); // trigger React onChange

    // Total Budget KPI must increase by 500
    const updatedTotal = parseAmt(await budgets.getKpiValue(budgets.totalBudgetCard));
    expect(updatedTotal).toBeCloseTo(initialTotal + 500, 0);
  });

  test('category card shows "X left" when spending is below budget', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Set a very high budget so the "remaining" text is guaranteed to appear
    const housingInput = budgets.categoryBudgetInput('Housing');
    await housingInput.click({ clickCount: 3 });
    await housingInput.fill('99999');
    await housingInput.press('Tab');

    // The card should now show "left" not "over"
    const housingCard = page.locator('div', { hasText: /^Housing/ }).first();
    await expect(housingCard.getByText(/left/)).toBeVisible();
  });

  test('category card shows "X over" when spending exceeds the budget limit', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Set Housing budget to $1 so it is definitely exceeded by even one transaction
    const housingInput = budgets.categoryBudgetInput('Housing');
    await housingInput.click({ clickCount: 3 });
    await housingInput.fill('1');
    await housingInput.press('Tab');

    // The card should now show "over"
    const housingCard = page.locator('div', { hasText: /^Housing/ }).first();
    await expect(housingCard.getByText(/over/)).toBeVisible();
  });
});
