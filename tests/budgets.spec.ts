import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets Tab tests
 * =================
 * User story: "As a user I want to manage spending budgets per category
 * so that I stay within my planned limits each month."
 *
 * Acceptance criteria:
 *  Happy path:
 *    AC1. Navigating to Budgets shows all 3 KPI cards (Total Budget, Total Spent, Remaining).
 *    AC2. All 8 category budget cards are rendered on load.
 *    AC3. Category search filters cards to matching names only.
 *    AC4. Clearing the search restores all 8 category cards.
 *    AC5. Increasing a category budget raises the Total Budget KPI.
 *    AC6. Remaining equals Total Budget − Total Spent (±$1 rounding tolerance).
 *    AC7. Month switching changes the Total Spent KPI value.
 *  Negative path:
 *    AC8. Searching for a non-existent category hides all budget cards.
 *    AC9. Setting a budget below actual spending shows the "over" label on that card.
 */

const EXPECTED_CATEGORIES = ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Shopping', 'Subscriptions'];

test.describe('Budgets — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const budgetsPage = factory.budgets();
    await budgetsPage.navigate();
  });

  // AC1 — All 3 KPI stat cards visible
  test('Budgets tab shows Total Budget, Total Spent, and Remaining KPI cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await expect(budgets.totalBudgetCard).toBeVisible();
    await expect(budgets.totalSpentCard).toBeVisible();
    await expect(budgets.remainingCard).toBeVisible();
  });

  // AC2 — All 8 category cards rendered
  test('all 8 spending category cards are visible on load', async ({ page }) => {
    // Verify each named category card is present
    for (const category of EXPECTED_CATEGORIES) {
      await expect(page.getByText(category, { exact: true }).first()).toBeVisible();
    }
  });

  // AC3 — Category search filters cards
  test('searching for "Housing" shows only the Housing category card', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.searchCategory('Housing');

    // Only Housing should remain
    await expect(page.getByText('Housing', { exact: true }).first()).toBeVisible();

    // Other categories should not be visible
    await expect(page.getByText('Food', { exact: true })).not.toBeVisible();
    await expect(page.getByText('Transport', { exact: true })).not.toBeVisible();
  });

  // AC4 — Clearing search restores all category cards
  test('clearing the category search restores all 8 category cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.searchCategory('Housing');
    // Confirm filtered state
    await expect(page.getByText('Food', { exact: true })).not.toBeVisible();

    // Clear search
    await budgets.searchCategory('');

    // All categories visible again
    for (const category of EXPECTED_CATEGORIES) {
      await expect(page.getByText(category, { exact: true }).first()).toBeVisible();
    }
  });

  // AC5 — Increasing a category budget raises Total Budget KPI
  test('increasing the Housing budget raises the Total Budget KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read current Total Budget
    const beforeText = await page
      .locator('div')
      .filter({ has: page.locator('p', { hasText: 'Total Budget' }) })
      .locator('p.text-xl')
      .first()
      .textContent();
    const before = parseFloat((beforeText ?? '0').replace(/[$,]/g, ''));

    // Increase Housing budget by $1000 (from default $2000 to $3000)
    const housingInput = page
      .locator('div', { hasText: /Housing/ })
      .getByRole('spinbutton')
      .first();
    await housingInput.fill('3000');
    await housingInput.press('Tab');

    // Total Budget must now be higher
    const afterText = await page
      .locator('div')
      .filter({ has: page.locator('p', { hasText: 'Total Budget' }) })
      .locator('p.text-xl')
      .first()
      .textContent();
    const after = parseFloat((afterText ?? '0').replace(/[$,]/g, ''));

    expect(after).toBeGreaterThan(before);
  });

  // AC6 — Remaining = Total Budget − Total Spent (±$1 tolerance)
  test('Remaining KPI equals Total Budget minus Total Spent within $1 tolerance', async ({ page }) => {
    const parseKpi = async (label: string): Promise<number> => {
      const text = await page
        .locator('div')
        .filter({ has: page.locator('p', { hasText: label }) })
        .locator('p.text-xl')
        .first()
        .textContent();
      return parseFloat((text ?? '0').replace(/[$,]/g, ''));
    };

    const totalBudget = await parseKpi('Total Budget');
    const totalSpent = await parseKpi('Total Spent');
    const remaining = await parseKpi('Remaining');

    // Allow $1 rounding tolerance
    expect(Math.abs(remaining - (totalBudget - totalSpent))).toBeLessThanOrEqual(1);
  });

  // AC7 — Month switching changes Total Spent
  test('switching from January to March changes the Total Spent KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.janButton.click();
    const janText = await page
      .locator('div')
      .filter({ has: page.locator('p', { hasText: 'Total Spent' }) })
      .locator('p.text-xl')
      .first()
      .textContent();

    await budgets.marButton.click();
    const marText = await page
      .locator('div')
      .filter({ has: page.locator('p', { hasText: 'Total Spent' }) })
      .locator('p.text-xl')
      .first()
      .textContent();

    // Seeded data is different each month
    expect(janText).not.toEqual(marText);
  });
});

test.describe('Budgets — negative path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const budgetsPage = factory.budgets();
    await budgetsPage.navigate();
  });

  // AC8 — No-match search hides all cards
  test('searching for a non-existent category hides all budget cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.searchCategory('xxxxxnotacategory99999');

    // None of the known categories should be visible
    for (const category of EXPECTED_CATEGORIES) {
      await expect(page.getByText(category, { exact: true })).not.toBeVisible();
    }
  });

  // AC9 — Budget below actual spending shows "over" label
  test('setting a category budget below actual spending shows the "over" label', async ({ page }) => {
    // Set Housing budget to $1 (effectively always under-spent vs seeded $1200+)
    const housingInput = page
      .locator('div', { hasText: /Housing/ })
      .getByRole('spinbutton')
      .first();
    await housingInput.fill('1');
    await housingInput.press('Tab');

    // The card should show the "over" suffix (e.g. "$1,399.xx over")
    const housingCard = page.locator('div').filter({ hasText: /Housing/ }).filter({ has: housingInput });
    await expect(housingCard.getByText(/over/i)).toBeVisible();
  });
});
