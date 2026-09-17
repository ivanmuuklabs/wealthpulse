import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets Tab — Happy Path & Negative Tests
 *
 * The Budgets tab lets users:
 *   - See three KPI cards: Total Budget, Total Spent, Remaining
 *   - Browse 8 per-category budget cards (Housing, Food, Transport, …)
 *   - Search categories by name
 *   - Switch months to compare budget usage
 *   - Edit a category's budget limit inline (number input)
 *
 * App state is in-memory; each test gets a fresh login so budgets always
 * start at the seeded defaults.
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

  test('three KPI cards (Total Budget, Total Spent, Remaining) are visible', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await expect(budgets.totalBudgetLabel).toBeVisible();
    await expect(budgets.totalSpentLabel).toBeVisible();
    await expect(budgets.remainingLabel).toBeVisible();
  });

  test('all 8 category budget cards are rendered by default', async ({ page }) => {
    // Eight categories are seeded: Housing, Food, Transport, Entertainment,
    // Health, Utilities, Shopping, Subscriptions
    const budgets = new PageFactory(page).budgets();
    const cards = budgets.categoryCardsByName();
    await expect(cards).toHaveCount(8);
  });

  test('category search for "Housing" shows exactly one card', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('Housing');

    // Only the Housing card should remain
    const cards = budgets.categoryCardsByName();
    await expect(cards).toHaveCount(1);
    await expect(page.getByText('Housing')).toBeVisible();
  });

  test('clearing the search input restores all 8 category cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('Food');
    const cards = budgets.categoryCardsByName();
    // Some match(es) after searching "Food"
    const countFiltered = await cards.count();
    expect(countFiltered).toBeLessThan(8);

    // Clear search
    await budgets.search('');
    await expect(cards).toHaveCount(8);
  });

  test('category search is case-insensitive', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // "housing" (all lowercase) should still match "Housing"
    await budgets.search('housing');
    const cards = budgets.categoryCardsByName();
    await expect(cards).toHaveCount(1);
  });

  test('switching months changes the Total Spent KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read March (default) Total Spent
    const spentMar = await budgets.getKpiValue('Total Spent');

    // Switch to January
    await budgets.selectMonth('Jan');

    const spentJan = await budgets.getKpiValue('Total Spent');

    // Both should be dollar amounts greater than zero
    expect(parseFloat(spentMar.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0);
    expect(parseFloat(spentJan.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0);

    // Values should differ across months (seeded random data)
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

    // Budget = $4,350 seeded; spent varies by random data
    expect(budget).toBeGreaterThan(0);

    // Allow $1 for floating-point rounding at the display layer
    expect(Math.abs((budget - spent) - remaining)).toBeLessThanOrEqual(1);
  });

  test('Budgets tab is reachable via the sidebar', async ({ page }) => {
    // Already navigated in beforeEach — verify the heading is visible
    await expect(page.getByText('Budgets').first()).toBeVisible();
  });

  test('all three month buttons are visible on the Budgets tab', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await expect(budgets.janButton).toBeVisible();
    await expect(budgets.febButton).toBeVisible();
    await expect(budgets.marButton).toBeVisible();
  });

});

/* ═══════════════════════════════════════
   NEGATIVE / EDGE-CASE TESTS
   ═══════════════════════════════════════ */

test.describe('Budgets — negative / edge cases', () => {

  test('searching for a non-existent category name hides all cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('zzznomatch9999');

    // No category cards should be visible
    const cards = budgets.categoryCardsByName();
    await expect(cards).toHaveCount(0);
  });

  test('partial search "Trans" matches only the Transport card', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('Trans');

    // "Trans" matches "Transport" — should yield exactly 1 card
    const cards = budgets.categoryCardsByName();
    await expect(cards).toHaveCount(1);
    await expect(page.getByText('Transport')).toBeVisible();
  });

  test('editing the Housing budget limit updates the input value', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Set Housing budget to a new value
    await budgets.setBudget('Housing', 2500);

    // The input should now reflect the new value
    const input = budgets.budgetInputFor('Housing');
    await expect(input).toHaveValue('2500');
  });

  test('rapid month switching does not crash the app — KPI cards remain visible', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Rapidly switch between months
    for (const month of ['Jan', 'Feb', 'Mar', 'Jan', 'Mar'] as const) {
      await budgets.selectMonth(month);
    }

    // After rapid switching, KPI labels must still be present
    await expect(budgets.totalBudgetLabel).toBeVisible();
    await expect(budgets.totalSpentLabel).toBeVisible();
    await expect(budgets.remainingLabel).toBeVisible();
  });

});
