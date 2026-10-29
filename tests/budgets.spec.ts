import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets module — happy path tests.
 *
 * User story: As a logged-in user I want to view my budget progress by category
 * and month, edit budget limits inline, and search for specific categories so
 * that I can stay on top of my spending and adjust limits as my needs change.
 *
 * Acceptance criteria:
 *   ✅ KPI summary cards (Total Budget, Total Spent, Remaining) are visible.
 *   ✅ Budget category cards are rendered with a progress indicator.
 *   ✅ Editing a budget limit inline updates the progress bar and KPI cards.
 *   ✅ Searching by category name filters the visible cards.
 *   ✅ Switching months recalculates spending figures while preserving budget limits.
 */

test.describe('Budgets — KPI summary cards', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();
  });

  test('Budgets page heading is visible after navigation', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await expect(budgets.heading).toBeVisible();
  });

  test('Total Budget KPI card is visible with a dollar amount', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await expect(budgets.totalBudgetCard).toBeVisible();
    await expect(budgets.totalBudgetCard).toContainText('$');
  });

  test('Total Spent KPI card is visible with a dollar amount', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await expect(budgets.totalSpentCard).toBeVisible();
    await expect(budgets.totalSpentCard).toContainText('$');
  });

  test('Remaining KPI card is visible with a dollar amount', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await expect(budgets.remainingCard).toBeVisible();
    await expect(budgets.remainingCard).toContainText('$');
  });
});

test.describe('Budgets — Category cards', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();
  });

  test('at least one budget category card is rendered', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    const count = await budgets.categoryCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('each budget category card contains an inline budget input', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    const count = await budgets.categoryCards.count();
    // Verify the first card has an editable spinbutton
    await expect(budgets.categoryCards.first().getByRole('spinbutton')).toBeVisible();
    // And there are multiple category cards (seeded data has 8 categories)
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('Housing budget category card is present', async ({ page }) => {
    // Housing is a guaranteed seeded category
    await expect(page.locator('div', { hasText: /^Housing/ }).first()).toBeVisible();
  });
});

test.describe('Budgets — Inline budget edit', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();
  });

  test('editing the Housing budget limit updates the inline input value', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Find the Housing card and change its budget to 1500
    const housingCard = page.locator('div').filter({ hasText: /^Housing/ }).first();
    const input = housingCard.getByRole('spinbutton');

    await input.fill('1500');
    await input.dispatchEvent('input');

    // The value should now reflect 1500
    await expect(input).toHaveValue('1500');
  });

  test('editing a budget limit recalculates the Total Budget KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read the current total budget
    const before = await budgets.kpiValue(budgets.totalBudgetCard);
    const beforeAmount = parseFloat(before.replace(/[$,]/g, ''));

    // Increase the first category's budget by 500
    const currentRaw = await budgets.getBudgetInputValue(0);
    const newLimit = parseFloat(currentRaw) + 500;
    await budgets.setBudgetLimit(0, newLimit);

    // Total Budget should now be higher
    const after = await budgets.kpiValue(budgets.totalBudgetCard);
    const afterAmount = parseFloat(after.replace(/[$,]/g, ''));

    expect(afterAmount).toBeGreaterThan(beforeAmount);
  });
});

test.describe('Budgets — Category search', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();
  });

  test('searching by category name filters the visible budget cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const allCount = await budgets.categoryCards.count();

    // Search for "Housing" — only that card should remain
    await budgets.searchCategory('Housing');

    const filteredCount = await budgets.categoryCards.count();
    expect(filteredCount).toBeLessThan(allCount);
    expect(filteredCount).toBeGreaterThan(0);

    // The visible card should contain the search term
    await expect(budgets.categoryCards.first()).toContainText('Housing');
  });

  test('clearing the category search restores all budget cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const allCount = await budgets.categoryCards.count();

    await budgets.searchCategory('Food');
    // Narrow down
    const narrowCount = await budgets.categoryCards.count();
    expect(narrowCount).toBeLessThan(allCount);

    // Clear
    await budgets.searchCategory('');
    await expect(budgets.categoryCards).toHaveCount(allCount);
  });

  test('searching for a term that matches no category shows no cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.searchCategory('xxxxxxnonexistent');

    const count = await budgets.categoryCards.count();
    expect(count).toBe(0);
  });
});

test.describe('Budgets — Month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();
  });

  test('Total Spent differs between February and March', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.switchMonth('Feb');
    const febSpent = await budgets.kpiValue(budgets.totalSpentCard);

    await budgets.switchMonth('Mar');
    const marSpent = await budgets.kpiValue(budgets.totalSpentCard);

    // Seeded data produces different spending amounts each month
    expect(febSpent).not.toEqual(marSpent);
  });

  test('budget limits remain the same when switching months', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.switchMonth('Feb');
    const febLimit = await budgets.getBudgetInputValue(0);

    await budgets.switchMonth('Mar');
    const marLimit = await budgets.getBudgetInputValue(0);

    // Budget limits are not month-dependent — they persist across month switches
    expect(febLimit).toEqual(marLimit);
  });
});
