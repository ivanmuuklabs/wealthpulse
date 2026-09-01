import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets — progress-bar thresholds & edge-case coverage
 *
 * Complements `budget.missing-flows.spec.ts` (PR #8) by covering the flows
 * that file intentionally left out:
 *
 *  1. Amber progress bar   — 70 < pct ≤ 90   → bg-amber-500
 *  2. Gradient progress bar — 90 < pct ≤ 100  → bg-gradient-to-r from-amber-500 to-red-500
 *  3. Search with no results — no cards rendered when query matches nothing
 *  4. Decreasing a budget limit lowers Total Budget and Remaining KPI cards
 *
 * All tests use seeded demo data and the BudgetsPage page object introduced in PR #8.
 */

test.describe('Budgets — progress-bar thresholds & edge cases', () => {
  /**
   * Login and navigate to the Budgets tab before each test.
   * Each test starts from a fresh in-memory state (seeded data).
   */
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().goto();
  });

  // ─── 1. Amber progress bar (70 – 90 % range) ─────────────────────────────

  test('progress bar is amber when spending is between 70 % and 90 % of budget', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    /**
     * Transport has a spend range of $5–$80 per transaction and receives
     * ~3–5 transactions a month. We set the budget so that the current spend
     * lands in the 70–90 % band. Housing spend is the most predictable
     * ($1,200–$1,800 per month, 1 tx). Set Housing budget to ~$2,400 so
     * the ratio is roughly 1,500 / 2,400 ≈ 63 %. We instead use Subscriptions
     * whose seeded spend is ~$16–$100/month (2 txns), then dial the budget
     * to put it firmly at 70–90 %.
     *
     * Strategy: read the current spend on each category, then pick the one
     * where setting budget = Math.ceil(spent / 0.8) puts us squarely in the
     * amber band without going over 90 %.
     */

    // Read all visible category cards to find a good candidate
    const allCats = ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Shopping', 'Subscriptions'];

    // Use Subscriptions as the test category — lowest and most predictable spend
    const spentText = await budgets.categoryCard('Subscriptions')
      .locator('p.text-\\[10px\\]')
      .first()
      .textContent();
    // spentText is like "$28.50 of $150.00"; extract the first dollar value
    const spentMatch = (spentText ?? '').match(/\$([\d,.]+)/);
    const spent = parseFloat((spentMatch?.[1] ?? '0').replace(/,/g, ''));

    // Set budget so pct = spent / budget lands at ~80 % (firmly in amber)
    const amberBudget = Math.ceil(spent / 0.80);
    await budgets.setBudget('Subscriptions', amberBudget);

    // Verify pct is in 70–90 range (percentage label should NOT be red and NOT be emerald)
    const pctLabel = budgets.categoryCard('Subscriptions').locator('span.font-bold.tabular-nums');
    await expect(pctLabel).not.toHaveClass(/text-red-400/);
    await expect(pctLabel).not.toHaveClass(/text-emerald-400/);
    // amber-band label uses text-amber-400
    await expect(pctLabel).toHaveClass(/text-amber-400/);

    // Progress bar fill should carry the amber class (not red, not emerald)
    const fill = budgets.progressBarFill('Subscriptions');
    await expect(fill).toHaveClass(/bg-amber-500/);
    await expect(fill).not.toHaveClass(/bg-red-500/);
    await expect(fill).not.toHaveClass(/bg-emerald-500/);
  });

  // ─── 2. Gradient progress bar (90 – 100 % range) ─────────────────────────

  test('progress bar shows amber-to-red gradient when spending is between 90 % and 100 % of budget', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read Subscriptions spend, then set budget = spent / 0.95 → pct ≈ 95 %
    const spentText = await budgets.categoryCard('Subscriptions')
      .locator('p.text-\\[10px\\]')
      .first()
      .textContent();
    const spentMatch = (spentText ?? '').match(/\$([\d,.]+)/);
    const spent = parseFloat((spentMatch?.[1] ?? '0').replace(/,/g, ''));

    const gradientBudget = Math.ceil(spent / 0.95);
    await budgets.setBudget('Subscriptions', gradientBudget);

    // Percentage label should be amber (>90 % but not >100 %)
    const pctLabel = budgets.categoryCard('Subscriptions').locator('span.font-bold.tabular-nums');
    await expect(pctLabel).toHaveClass(/text-amber-400/);
    await expect(pctLabel).not.toHaveClass(/text-red-400/);

    // Fill should carry the gradient class
    const fill = budgets.progressBarFill('Subscriptions');
    await expect(fill).toHaveClass(/bg-gradient-to-r/);
    await expect(fill).toHaveClass(/from-amber-500/);
    await expect(fill).toHaveClass(/to-red-500/);
    await expect(fill).not.toHaveClass(/bg-red-500/); // solid red only above 100 %
  });

  // ─── 3. Search with no matching results ──────────────────────────────────

  test('searching for a term that matches no category hides all budget cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // A query that matches none of the 8 category names
    await budgets.searchCategory('xyznonexistent');

    // All 8 cards should be hidden (filtered out by the app)
    for (const cat of ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Shopping', 'Subscriptions']) {
      await expect(budgets.categoryCard(cat)).not.toBeVisible();
    }

    // After clearing the search, all cards return
    await budgets.clearSearch();
    await expect(budgets.categoryCard('Housing')).toBeVisible();
    await expect(budgets.categoryCard('Food')).toBeVisible();
  });

  test('partially matching query shows only matching cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // "h" matches Housing, Health — two cards
    await budgets.searchCategory('h');

    await expect(budgets.categoryCard('Housing')).toBeVisible();
    await expect(budgets.categoryCard('Health')).toBeVisible();

    // Non-matching cards must not be visible
    for (const cat of ['Food', 'Transport', 'Entertainment', 'Utilities', 'Shopping', 'Subscriptions']) {
      await expect(budgets.categoryCard(cat)).not.toBeVisible();
    }
  });

  // ─── 4. Decreasing a budget limit lowers KPI cards ───────────────────────

  test('decreasing a budget limit immediately lowers the Total Budget KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read current Total Budget (all categories summed)
    const before = await budgets.getKpiAmount('Total Budget');

    // Reduce Housing budget from $2,000 to $1,500 (–$500)
    await budgets.setBudget('Housing', 1500);

    const after = await budgets.getKpiAmount('Total Budget');
    expect(after).toBeCloseTo(before - 500, 0);
  });

  test('decreasing a budget limit immediately lowers the Remaining KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const remainingBefore = await budgets.getKpiAmount('Remaining');

    // Reduce Food budget from $600 to $200 (–$400)
    await budgets.setBudget('Food', 200);

    const remainingAfter = await budgets.getKpiAmount('Remaining');
    expect(remainingAfter).toBeLessThan(remainingBefore);
  });

  test('Remaining KPI stays consistent after a budget decrease (Total Budget − Total Spent)', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Lower Entertainment budget from $200 to $50
    await budgets.setBudget('Entertainment', 50);

    const totalBudget = await budgets.getKpiAmount('Total Budget');
    const totalSpent  = await budgets.getKpiAmount('Total Spent');
    const remaining   = await budgets.getKpiAmount('Remaining');

    // Allow $1 rounding tolerance (same as the PR's own assertion)
    expect(Math.abs(remaining - (totalBudget - totalSpent))).toBeLessThanOrEqual(1);
  });
});
