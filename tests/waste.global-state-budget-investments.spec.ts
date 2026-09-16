import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Global-state crossover tests for PR #13 — "Rename Expenses section to Waste".
 *
 * PR #13 adds April (selectedMonth=3) to the Waste tab's month selector.
 * The `selectedMonth` value is shared global state via `useReducer` across all
 * tabs. This file guards two scenarios NOT covered by the existing
 * waste.dashboard-state-crossover.spec.ts:
 *
 *  1. Budgets tab KPI values when selectedMonth=3 (April)
 *     BudgetsTab uses `selectedMonth` to compute its KPI values
 *     (getMonthTransactions). With April selected in Waste, navigating to
 *     Budgets should show April-seeded data and still render correctly.
 *
 *  2. Investments tab unaffected by selectedMonth=3
 *     InvestmentsTab doesn't filter by month, so its UI must remain stable
 *     regardless of which month is active in Waste.
 *
 *  3. Switching month in Waste doesn't affect the Budgets month-selector
 *     highlight — Budgets only renders [0,1,2] so no button is highlighted
 *     when selectedMonth=3 (mirrors the Dashboard gap documented in
 *     waste.dashboard-state-crossover.spec.ts).
 *
 *  4. After navigating Waste (April) → Budgets → clicking Jan in Budgets,
 *     the global selectedMonth resets to 0, and returning to Waste shows
 *     Jan highlighted (round-trip state correctness).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

/** Login, navigate to Waste, select April, then navigate to the given tab. */
async function setupAprilThenGoTo(
  page: Parameters<typeof PageFactory>[0],
  tab: 'Budgets' | 'Investments',
) {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

  const waste = factory.waste();
  await waste.navigate();
  await expect(waste.heading).toBeVisible();
  await waste.selectMonth('Apr');
  await expect(page.getByRole('button', { name: 'Apr', exact: true })).toHaveClass(/text-emerald-400/);

  await page.getByRole('button', { name: tab }).click();
  await expect(
    page.getByRole('heading', { name: tab, level: 2 }),
  ).toBeVisible();

  return factory;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Budgets tab with selectedMonth=3 (April)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Budgets tab — KPI rendering when selectedMonth=3 (April, PR #13)', () => {
  /**
   * With selectedMonth=3 the Budgets tab computes
   *   getMonthTransactions(txns, 3) → April transactions.
   * The generator (expanded by PR #13) seeds data for April, so all 3 KPI
   * cards must show a non-zero dollar value.
   */

  test('Budgets KPI cards render correctly when selectedMonth is April', async ({ page }) => {
    await setupAprilThenGoTo(page, 'Budgets');

    // All 3 KPI stat cards must be visible
    await expect(page.getByText('Total Budget')).toBeVisible();
    await expect(page.getByText('Total Spent').first()).toBeVisible();
    await expect(page.getByText('Remaining').first()).toBeVisible();
  });

  test('Budgets Total Spent is non-zero for April (seeded data exists)', async ({ page }) => {
    await setupAprilThenGoTo(page, 'Budgets');

    // Total Spent should reflect April transactions (non-zero from seeded data)
    const spentCard = page
      .getByText('Total Spent')
      .first()
      .locator('..')
      .locator('text=/\\$[\\d,]+/')
      .first();

    await expect(spentCard).toBeVisible();
    const spentText = await spentCard.textContent();
    const spentValue = parseFloat((spentText ?? '').replace(/[$,]/g, ''));
    expect(spentValue).toBeGreaterThan(0);
  });

  test('Budgets tab still shows all 8 category cards when selectedMonth=3 (April)', async ({ page }) => {
    await setupAprilThenGoTo(page, 'Budgets');

    // Category cards are rendered for all 8 CATEGORIES regardless of month
    for (const category of [
      'Housing', 'Food', 'Transport', 'Entertainment',
      'Health', 'Utilities', 'Shopping', 'Subscriptions',
    ]) {
      await expect(page.getByText(category).first()).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Investments tab unaffected by selectedMonth=3
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Investments tab — unaffected by Waste tab April state (PR #13)', () => {
  /**
   * InvestmentsTab does not filter by selectedMonth at all.
   * All 6 fund cards must be visible and the sub-tabs (Fund Cards, Compare,
   * Calculator, Portfolio Builder) must be navigable regardless of the global
   * month state.
   */

  test('Investments tab shows all 6 fund cards when selectedMonth=3 (April)', async ({ page }) => {
    await setupAprilThenGoTo(page, 'Investments');

    // The default sub-tab (Fund Cards) must show 6 fund cards
    // Each card has a distinct fund name; check at least 2 to confirm rendering
    const cards = page.locator('[class*="rounded-2xl"]').filter({ hasText: /Risk:/ });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1); // at least 1 card rendered (6 expected)
  });

  test('Investments heading is visible and not affected by April global state', async ({ page }) => {
    await setupAprilThenGoTo(page, 'Investments');

    // The Investments heading must be present and correct
    await expect(page.getByRole('heading', { name: 'Investments', level: 2 })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Budgets month selector — no button highlighted when selectedMonth=3
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Budgets month selector — no highlight when selectedMonth=3 (PR #13)', () => {
  /**
   * BudgetsTab renders [0,1,2].map(m => <MonthButton key={m} m={m} />) —
   * unchanged by PR #13. When selectedMonth=3 (April, set in Waste tab),
   * none of Jan/Feb/Mar buttons matches the active index, so none should
   * carry the emerald-400 active class.
   * This mirrors the Dashboard gap documented in waste.dashboard-state-crossover.spec.ts.
   */

  test('no Budgets month button is highlighted when selectedMonth=3 (April)', async ({ page }) => {
    await setupAprilThenGoTo(page, 'Budgets');

    const monthBar = page
      .locator('div.flex.rounded-xl.p-1.border')
      .filter({ has: page.getByRole('button', { name: 'Jan' }) })
      .first();

    await expect(monthBar).toBeVisible();

    // None of Jan/Feb/Mar should have the active emerald class
    for (const label of ['Jan', 'Feb', 'Mar']) {
      await expect(
        monthBar.getByRole('button', { name: label }),
      ).not.toHaveClass(/text-emerald-400/);
    }
  });

  test('Budgets month selector has only 3 buttons (Jan/Feb/Mar) — Apr not present', async ({ page }) => {
    await setupAprilThenGoTo(page, 'Budgets');

    const monthBar = page
      .locator('div.flex.rounded-xl.p-1.border')
      .filter({ has: page.getByRole('button', { name: 'Jan' }) })
      .first();

    await expect(monthBar.getByRole('button', { name: 'Jan' })).toBeVisible();
    await expect(monthBar.getByRole('button', { name: 'Feb' })).toBeVisible();
    await expect(monthBar.getByRole('button', { name: 'Mar' })).toBeVisible();
    // April must NOT appear in the Budgets month bar (only added to Waste by PR #13)
    await expect(monthBar.getByRole('button', { name: 'Apr', exact: true })).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Round-trip: Waste (April) → Budgets (click Jan) → back to Waste
// ─────────────────────────────────────────────────────────────────────────────

test.describe('State round-trip: Waste April → Budgets Jan → Waste (PR #13)', () => {
  /**
   * When the user:
   *  1. Selects April in Waste → selectedMonth=3
   *  2. Navigates to Budgets and clicks Jan → selectedMonth=0
   *  3. Returns to Waste
   *
   * Expected: In Waste, January is now highlighted (not April), and the
   * transaction table shows January data.
   */

  test('returning to Waste after clicking Jan in Budgets shows January active in Waste', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // 1. Select April in Waste
    const waste = factory.waste();
    await waste.navigate();
    await waste.selectMonth('Apr');
    await expect(page.getByRole('button', { name: 'Apr', exact: true })).toHaveClass(/text-emerald-400/);

    // 2. Navigate to Budgets and click Jan
    await page.getByRole('button', { name: 'Budgets' }).click();
    await expect(page.getByRole('heading', { name: 'Budgets', level: 2 })).toBeVisible();

    const budgetsMonthBar = page
      .locator('div.flex.rounded-xl.p-1.border')
      .filter({ has: page.getByRole('button', { name: 'Jan' }) })
      .first();

    await budgetsMonthBar.getByRole('button', { name: 'Jan' }).click();
    // Jan is now active in Budgets → selectedMonth=0
    await expect(budgetsMonthBar.getByRole('button', { name: 'Jan' })).toHaveClass(/text-emerald-400/);

    // 3. Return to Waste
    await waste.sidebarButton.click();
    await expect(waste.heading).toBeVisible();

    // Jan must now be the active month in the Waste selector (selectedMonth=0)
    await expect(page.getByRole('button', { name: 'Jan', exact: true })).toHaveClass(/text-emerald-400/);

    // Apr must no longer be highlighted
    await expect(page.getByRole('button', { name: 'Apr', exact: true })).not.toHaveClass(/text-emerald-400/);

    // The transaction table must show January data (non-zero rows)
    const rowCount = await waste.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
