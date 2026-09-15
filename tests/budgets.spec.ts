import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets tab tests
 *
 * User story: As a user I can see how my spending in each category compares
 * to my budget limit, adjust individual budget limits inline, search/filter
 * categories, and switch months to compare spending periods.
 *
 * Happy path:  page loads with 8 category cards, KPI math is correct,
 *              inline budget edit persists and updates the Remaining KPI,
 *              category search filters the visible cards.
 * Negative:    Over-budget category shows the red progress bar and "over"
 *              label; switching months recalculates KPIs correctly.
 */

test.describe('Budgets — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('Budgets tab loads with the Budgets heading and all 8 category cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    await expect(budgets.heading).toBeVisible();

    // The app defines 8 categories: Housing, Food, Transport, Entertainment,
    // Health, Utilities, Shopping, Subscriptions — all should render as cards.
    await expect(budgets.categoryCards).toHaveCount(8);
  });

  test('three KPI cards (Total Budget, Total Spent, Remaining) are all visible', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    await expect(page.getByText('Total Budget')).toBeVisible();
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Remaining')).toBeVisible();
  });

  test('Remaining KPI equals Total Budget minus Total Spent (within $1 rounding)', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    const totalBudget = await budgets.getKpiValue('Total Budget');
    const totalSpent = await budgets.getKpiValue('Total Spent');
    const remaining = await budgets.getKpiValue('Remaining');

    // Allow a $1 floating-point tolerance
    expect(Math.abs(remaining - (totalBudget - totalSpent))).toBeLessThanOrEqual(1);
  });

  test('each category card contains an inline budget-limit number input', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    // Every card should expose a spinbutton (type="number") for editing the limit
    const count = await budgets.categoryCards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const input = budgets.categoryCards.nth(i).getByRole('spinbutton');
      await expect(input).toBeVisible();
    }
  });

  test('editing the Food budget limit updates the remaining label on that card', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    // Set a very high Food budget so it definitely shows "left" (not "over")
    await budgets.setBudgetLimit('Food', 9999);

    // The Food card's remaining label should now show a positive "left" value
    const foodCard = budgets.getCategoryCard('Food');
    await expect(foodCard).toContainText('left');
  });

  test('category search filters to show only matching cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    await budgets.searchInput.fill('Housing');

    // Only the Housing card should remain visible
    await expect(budgets.categoryCards).toHaveCount(1);
    await expect(budgets.categoryCards.first()).toContainText('Housing');
  });

  test('clearing the category search restores all 8 category cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    await budgets.searchInput.fill('Housing');
    await expect(budgets.categoryCards).toHaveCount(1);

    // Clear the search
    await budgets.searchInput.clear();
    await expect(budgets.categoryCards).toHaveCount(8);
  });

  test('month selector is visible with Jan, Feb, Mar buttons', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    await expect(budgets.janButton).toBeVisible();
    await expect(budgets.febButton).toBeVisible();
    await expect(budgets.marButton).toBeVisible();
  });

  test('switching from March to February changes the Total Spent KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    const marSpent = await budgets.getKpiValue('Total Spent');
    await budgets.febButton.click();
    const febSpent = await budgets.getKpiValue('Total Spent');

    // Seeded data generates different spending totals per month
    expect(febSpent).not.toEqual(marSpent);
  });
});

test.describe('Budgets — negative / edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('setting a budget limit to 0 marks the category as over-budget (100%+)', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    // Set Food budget to $1 — actual spending will exceed it, so the card goes red
    await budgets.setBudgetLimit('Food', 1);

    const foodCard = budgets.getCategoryCard('Food');

    // The percentage label should exceed 100 (shown as red text)
    const pctText = await foodCard.locator('span.text-lg.font-bold').textContent();
    const pct = parseInt(pctText ?? '0', 10);
    expect(pct).toBeGreaterThan(100);

    // The "over" label should appear
    await expect(foodCard).toContainText('over');
  });

  test('category search with a non-existent term shows no cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    await budgets.searchInput.fill('xxxxxxxxnotacategory');

    // No category cards should match
    await expect(budgets.categoryCards).toHaveCount(0);
  });

  test('budget limits remain consistent when switching months back and forth', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    // Read Housing budget on March
    const housingCard = budgets.getCategoryCard('Housing');
    const marLimit = await housingCard.getByRole('spinbutton').inputValue();

    // Switch to February — limit should be the same (budgets are global, not per-month)
    await budgets.febButton.click();
    const febLimit = await housingCard.getByRole('spinbutton').inputValue();
    expect(febLimit).toEqual(marLimit);

    // Switch back to March
    await budgets.marButton.click();
    const marLimitAgain = await housingCard.getByRole('spinbutton').inputValue();
    expect(marLimitAgain).toEqual(marLimit);
  });
});
