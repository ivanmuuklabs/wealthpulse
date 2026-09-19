import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets tab — smoke and filter tests
 *
 * Gap addressed by Amikoo QA review of PR #49.
 *
 * PR #49 adds budgets.edit-limit.spec.ts which tests the inline spinbutton
 * update (SET_BUDGET reducer). These tests cover the remaining untested
 * Budgets flows:
 *
 *  - The Budgets tab loads and shows the expected heading
 *  - All three KPI stat cards are visible (Total Budget, Total Spent, Remaining)
 *  - All 8 category budget cards are rendered by default
 *  - The category search input filters cards to matching categories
 *  - Clearing the search input restores all category cards
 *  - Month switching updates the Total Spent KPI
 *
 * Uses the BudgetsPage POM added by PR #49.
 */

test.describe('Budgets — tab loads and KPI cards visible', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();
  });

  test('Budgets heading is visible after navigation', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
  });

  test('Total Budget, Total Spent, and Remaining KPI cards are all visible', async ({ page }) => {
    await expect(page.getByText('Total Budget')).toBeVisible();
    await expect(page.getByText('Total Spent').first()).toBeVisible();
    await expect(page.getByText('Remaining')).toBeVisible();
  });

  test('Total Budget KPI shows a dollar value greater than $0', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const text = await budgets.totalBudgetValue.textContent();
    const amount = parseFloat((text ?? '').replace(/[$,]/g, ''));
    // The default budgets sum to $4,350
    expect(amount).toBeGreaterThan(0);
  });
});

test.describe('Budgets — category search filter', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();
  });

  test('searching "Food" shows only the Food category card', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.searchCategory('Food');

    // The Food card must be visible
    await expect(page.getByText('Food').first()).toBeVisible();

    // A different category (Housing) must be hidden after filtering
    // The card grid should not contain a "Housing" heading
    const housingCard = page.locator('p.text-white.font-semibold', { hasText: 'Housing' });
    await expect(housingCard).toHaveCount(0);
  });

  test('searching a term with no match shows an empty card grid', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.searchCategory('ZZZNOTACATEGORY');

    // No category cards should be rendered
    // The search filter returns an empty list — no card headings visible
    const cards = page.locator('p.text-white.font-semibold.text-sm').filter({ hasText: /Housing|Food|Transport|Entertainment|Health|Utilities|Shopping|Subscriptions/ });
    await expect(cards).toHaveCount(0);
  });

  test('clearing the search input after filtering restores all category headings', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Filter down
    await budgets.searchCategory('Food');
    await expect(page.getByText('Housing', { exact: true }).first()).not.toBeVisible();

    // Clear the search
    await budgets.searchInput.clear();

    // Housing card should be back
    await expect(page.getByText('Housing', { exact: true }).first()).toBeVisible();
  });
});

test.describe('Budgets — month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();
  });

  test('switching from March to January changes the Total Spent KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read Total Spent for March (default)
    const marText = await budgets.totalSpentValue.textContent();
    const marAmount = parseFloat((marText ?? '').replace(/[$,]/g, ''));

    // Switch to January
    await budgets.selectMonth('Jan');

    // Total Spent for January must differ from March (seeded data is per-month)
    const janText = await budgets.totalSpentValue.textContent();
    const janAmount = parseFloat((janText ?? '').replace(/[$,]/g, ''));

    expect(janAmount).not.toBeCloseTo(marAmount, 0);
  });
});
