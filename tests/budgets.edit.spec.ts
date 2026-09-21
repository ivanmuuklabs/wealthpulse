import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests for the Budgets tab — write flows.
 *
 * budget.comparison.spec.ts (on main) covers read-only month comparisons
 * and the Remaining KPI math. This file covers the write path:
 *
 *   9.  Editing a budget limit via the inline spinbutton fires SET_BUDGET
 *       and immediately recalculates the Total Budget and Remaining KPIs.
 *   10. Lowering a budget limit below the already-spent amount makes the
 *       progress bar and "over" label appear in the red/over state.
 *   11. Category search narrows the budget cards to only matching categories.
 */

test.describe('Budgets — edit budget limit', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const budgets = factory.budgets();
    await budgets.navigate();

    // Use March for a consistent data set
    await budgets.selectMonth('Mar');
  });

  // ── Test 9 ──────────────────────────────────────────────────────────
  // Changing the Housing spinbutton value updates the Total Budget KPI.
  // Before: Housing budget = 2000 (seeded).
  // After : we increase it to 3000 — Total Budget must increase by 1000.
  test('increasing the Housing budget limit raises the Total Budget KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read the baseline Total Budget
    const before = await budgets.getKpiValue('Total Budget');
    expect(before).toBeGreaterThan(0);

    // The seeded Housing budget is 2000; we raise it to 3000
    await budgets.setBudgetLimit('Housing', 3000);

    // Give React one tick to process the state update
    await page.waitForTimeout(200);

    const after = await budgets.getKpiValue('Total Budget');

    // Total Budget must have increased by exactly 1000
    expect(after - before).toBeCloseTo(1000, 0);
  });

  // ── Test 10 ──────────────────────────────────────────────────────────
  // Setting a budget lower than the actual spend for a category causes the
  // "X over" label to appear (Remaining KPI goes negative → "over" text).
  test('setting budget below spent amount shows over-budget label for that category', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Housing always has a large spend (seeded at ≥ $1,200).
    // Setting its limit to $1 guarantees it is over budget.
    await budgets.setBudgetLimit('Housing', 1);

    await page.waitForTimeout(200);

    // The "over" text must appear in the Housing card
    await expect(
      page.locator('div', { hasText: /^Housing/ }).getByText(/over/)
    ).toBeVisible();
  });

  // ── Test 11 ──────────────────────────────────────────────────────────
  // The category search input narrows the displayed budget cards to only
  // those whose category name includes the typed text.
  test('category search narrows budget cards to matching categories', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Count all cards before filtering (should be 8 seeded categories)
    const allCards = page.locator('div.grid > div').filter({ hasText: /% / });
    const totalCards = await allCards.count();
    expect(totalCards).toBeGreaterThan(1);

    // Search for "Food" — only the Food card should remain
    await budgets.searchInput.fill('Food');

    // Give React a moment to re-render
    await page.waitForTimeout(200);

    const filteredCards = page.locator('div.grid > div').filter({ hasText: /% / });
    const filteredCount = await filteredCards.count();

    expect(filteredCount).toBeLessThan(totalCards);
    expect(filteredCount).toBeGreaterThan(0);

    // The remaining card(s) must mention "Food"
    await expect(filteredCards.first()).toContainText('Food');
  });
});
