import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets Tab — Happy Path & Edge-Case Tests
 *
 * The Budgets tab exposes:
 *   - Three KPI stat cards: Total Budget, Total Spent, Remaining
 *   - 8 category budget cards (Housing → Subscriptions) each with an
 *     inline number input to edit the limit
 *   - A search input to filter visible category cards by name
 *   - A month selector (Jan / Feb / Mar) shared with other tabs
 *
 * All tests start from a fresh login (seeded in-memory state).
 */

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await factory.budgets().navigate();
});

/* ═══════════════════════════════════════
   HAPPY PATH TESTS
   ═══════════════════════════════════════ */

test.describe('Budgets — happy path', () => {

  test('three KPI labels (Total Budget, Total Spent, Remaining) are visible', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // KPI card labels must all be present after navigation
    await expect(budgets.totalBudgetLabel).toBeVisible();
    await expect(budgets.totalSpentLabel).toBeVisible();
    await expect(budgets.remainingLabel).toBeVisible();
  });

  test('all 8 category budget cards are rendered by default', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // The 8 seeded categories: Housing, Food, Transport, Entertainment,
    // Health, Utilities, Shopping, Subscriptions — each renders a number input.
    const cards = budgets.categoryCardsByName();
    await expect(cards).toHaveCount(8);
  });

  test('searching for "Housing" shows exactly one matching card', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('Housing');

    const cards = budgets.categoryCardsByName();
    await expect(cards).toHaveCount(1);
    await expect(page.getByText('Housing')).toBeVisible();
  });

  test('clearing the search input restores all 8 category cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Apply a filter first
    await budgets.search('Food');
    const filtered = budgets.categoryCardsByName();
    const countFiltered = await filtered.count();
    expect(countFiltered).toBeLessThan(8);

    // Clear the search
    await budgets.search('');

    // All cards should reappear
    await expect(filtered).toHaveCount(8);
  });

  test('category search is case-insensitive ("housing" matches "Housing")', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('housing');

    const cards = budgets.categoryCardsByName();
    await expect(cards).toHaveCount(1);
  });

  test('switching from March to January changes the Total Spent KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const spentMar = await budgets.getKpiValue('Total Spent');

    await budgets.selectMonth('Jan');
    const spentJan = await budgets.getKpiValue('Total Spent');

    // Both months have seeded transactions so values are non-zero dollar amounts
    expect(parseFloat(spentMar.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0);
    expect(parseFloat(spentJan.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0);

    // Seeded random data makes identical values extremely unlikely
    expect(spentMar).not.toEqual(spentJan);
  });

  test('Remaining equals Total Budget minus Total Spent (within $1 rounding tolerance)', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const budgetText    = await budgets.getKpiValue('Total Budget');
    const spentText     = await budgets.getKpiValue('Total Spent');
    const remainingText = await budgets.getKpiValue('Remaining');

    const budget    = parseFloat(budgetText.replace(/[^0-9.]/g, ''));
    const spent     = parseFloat(spentText.replace(/[^0-9.]/g, ''));
    const remaining = parseFloat(remainingText.replace(/[^0-9.]/g, ''));

    // Total budget is seeded at $4,350 — must be positive
    expect(budget).toBeGreaterThan(0);

    // Allow $1 for floating-point rounding at the display layer
    expect(Math.abs((budget - spent) - remaining)).toBeLessThanOrEqual(1);
  });

  test('all three month selector buttons are visible on the Budgets tab', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await expect(budgets.janButton).toBeVisible();
    await expect(budgets.febButton).toBeVisible();
    await expect(budgets.marButton).toBeVisible();
  });

  test('editing the Housing budget limit updates the input value', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.setBudget('Housing', 2500);

    const input = budgets.budgetInputFor('Housing');
    await expect(input).toHaveValue('2500');
  });

});

/* ═══════════════════════════════════════
   EDGE-CASE TESTS
   ═══════════════════════════════════════ */

test.describe('Budgets — edge cases', () => {

  test('searching for a non-existent term hides all category cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('zzznomatch9999');

    const cards = budgets.categoryCardsByName();
    await expect(cards).toHaveCount(0);
  });

  test('partial search "Trans" matches only the Transport card', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('Trans');

    const cards = budgets.categoryCardsByName();
    await expect(cards).toHaveCount(1);
    await expect(page.getByText('Transport')).toBeVisible();
  });

  test('rapid month switching does not crash the app — KPI labels stay visible', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Rapidly cycle through months
    for (const month of ['Jan', 'Feb', 'Mar', 'Jan', 'Mar'] as const) {
      await budgets.selectMonth(month);
    }

    // After rapid switching the KPI labels must still be present
    await expect(budgets.totalBudgetLabel).toBeVisible();
    await expect(budgets.totalSpentLabel).toBeVisible();
    await expect(budgets.remainingLabel).toBeVisible();
  });

  test('Remaining is never greater than Total Budget (spending can only be >= 0)', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const budgetText    = await budgets.getKpiValue('Total Budget');
    const remainingText = await budgets.getKpiValue('Remaining');

    const budget    = parseFloat(budgetText.replace(/[^0-9.]/g, ''));
    const remaining = parseFloat(remainingText.replace(/[^0-9.]/g, ''));

    // Remaining ≤ Total Budget (allowing $1 rounding tolerance)
    expect(remaining).toBeLessThanOrEqual(budget + 1);
  });

});
