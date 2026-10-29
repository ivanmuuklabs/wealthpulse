import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests for the Budgets tab.
 *
 * User story: As a user I can set monthly spending limits per category,
 * track how much I've spent, and switch between months to compare.
 *
 * Acceptance criteria:
 *  1. All three overview KPI cards (Total Budget, Total Spent, Remaining) are visible.
 *  2. All 8 category budget cards are rendered by default.
 *  3. Searching for a category name filters the cards to matching ones only.
 *  4. Clearing the search restores all 8 category cards.
 *  5. Editing a budget spinbutton raises the Total Budget KPI accordingly.
 *  6. Remaining = Total Budget − Total Spent (within $1 rounding tolerance).
 *  7. Switching months changes the Total Spent value.
 *  8. A category over budget shows the "over" label with red text.
 *  9. A no-match search hides all category cards.
 */

test.describe('Budgets — happy path', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.budgets().navigate();
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
  });

  // AC 1 — Three KPI stat cards visible
  test('Total Budget, Total Spent, and Remaining KPI cards are all visible', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await expect(budgets.totalBudgetLabel).toBeVisible();
    await expect(budgets.totalSpentLabel).toBeVisible();
    await expect(budgets.remainingLabel).toBeVisible();
  });

  // AC 2 — 8 category spinbuttons by default (one per category card)
  test('all 8 category budget spinbuttons are rendered by default', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await expect(budgets.budgetSpinbuttons).toHaveCount(8);
  });

  // AC 3 — Searching for "Housing" shows exactly one card
  test('searching for "Housing" filters category cards to Housing only', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('Housing');

    // Only the Housing card remains visible; its spinbutton is the only one
    await expect(budgets.budgetSpinbuttons).toHaveCount(1);
    await expect(page.getByText('Housing').first()).toBeVisible();
  });

  // AC 4 — Clearing search restores all 8 cards
  test('clearing the category search restores all 8 budget cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('Food');
    await expect(budgets.budgetSpinbuttons).toHaveCount(1);

    await budgets.clearSearch();
    await expect(budgets.budgetSpinbuttons).toHaveCount(8);
  });

  // AC 5 — Editing Housing budget raises Total Budget KPI
  test('increasing the Housing budget spinbutton raises the Total Budget KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read current Total Budget
    const totalBudgetEl = page
      .locator('p')
      .filter({ hasText: /^Total Budget$/i })
      .locator('~ p')
      .first();
    const before = await totalBudgetEl.textContent();
    const beforeNum = parseFloat((before ?? '').replace(/[^0-9.]/g, ''));

    // Search for Housing so we only have one spinbutton; less ambiguity
    await budgets.search('Housing');
    const housingInput = budgets.budgetSpinbuttons.first();

    // Set to a higher value (seeded default is 2000; use 2500)
    await housingInput.fill('2500');
    await housingInput.press('Tab');

    await budgets.clearSearch();

    // Total Budget should now be higher
    const after = await totalBudgetEl.textContent();
    const afterNum = parseFloat((after ?? '').replace(/[^0-9.]/g, ''));
    expect(afterNum).toBeGreaterThan(beforeNum);
  });

  // AC 6 — Remaining ≈ Total Budget − Total Spent
  test('Remaining equals Total Budget minus Total Spent within $1 tolerance', async ({ page }) => {
    const totalBudgetEl = page
      .locator('p')
      .filter({ hasText: /^Total Budget$/i })
      .locator('~ p')
      .first();
    const totalSpentEl = page
      .locator('p')
      .filter({ hasText: /^Total Spent$/i })
      .locator('~ p')
      .first();
    const remainingEl = page
      .locator('p')
      .filter({ hasText: /^Remaining$/i })
      .locator('~ p')
      .first();

    const parse = (t: string | null) => parseFloat((t ?? '').replace(/[^0-9.]/g, ''));

    const budget = parse(await totalBudgetEl.textContent());
    const spent = parse(await totalSpentEl.textContent());
    const remaining = parse(await remainingEl.textContent());

    expect(Math.abs(remaining - (budget - spent))).toBeLessThanOrEqual(1);
  });

  // AC 7 — Switching months changes Total Spent
  test('switching from March to February changes the Total Spent KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const spentEl = page
      .locator('p')
      .filter({ hasText: /^Total Spent$/i })
      .locator('~ p')
      .first();

    const marSpent = await spentEl.textContent();

    await budgets.selectMonth(1); // February

    const febSpent = await spentEl.textContent();
    expect(marSpent).not.toEqual(febSpent);
  });
});

test.describe('Budgets — negative and edge cases', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.budgets().navigate();
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
  });

  // AC 8 — Over-budget category shows "over" label
  test('setting a budget below actual spending shows the "over" label', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Filter to Housing — it always has a rent transaction (~$1200+) in March
    await budgets.search('Housing');

    // Set budget well below spending (Housing rent is usually $1200–$1800)
    const housingInput = budgets.budgetSpinbuttons.first();
    await housingInput.fill('1');
    await housingInput.press('Tab');

    // The "over" text must appear (rendered as "over" in the remaining label)
    await expect(page.getByText(/over/i).first()).toBeVisible();
  });

  // AC 9 — No-match category search hides all cards
  test('searching for a non-existent category hides all budget cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('xyzzy_no_such_category');

    // No spinbuttons should be visible
    await expect(budgets.budgetSpinbuttons).toHaveCount(0);
  });

  // Rapid month switching does not crash; Budgets heading stays visible
  test('rapid month switching does not crash the Budgets tab', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    for (const m of [0, 1, 2, 1, 0, 2] as const) {
      await budgets.selectMonth(m);
    }

    await expect(budgets.heading).toBeVisible();
    await expect(budgets.budgetSpinbuttons).toHaveCount(8);
  });

  // Setting a budget to 0 makes Remaining negative and shows "over" label
  test('setting Housing budget to $0 shows the "over" label', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('Housing');
    const housingInput = budgets.budgetSpinbuttons.first();
    await housingInput.fill('0');
    await housingInput.press('Tab');

    // "X over" text should appear since spending > 0 budget
    await expect(page.getByText(/over/i).first()).toBeVisible();
  });
});
