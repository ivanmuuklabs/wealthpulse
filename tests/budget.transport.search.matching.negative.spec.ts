import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';

/**
 * Budgets category search — negative tests complementing
 * budget.transport.search.matching.happy.spec.ts (case-insensitive / partial matching).
 *
 * App behavior relied on (src/App.jsx, BudgetsTab on main): cards are filtered with
 * `!search || b.cat.toLowerCase().includes(search.toLowerCase())` — a case-insensitive
 * substring match on the category name only. The search term is NOT trimmed, and the
 * category icon is not part of the matched text.
 *
 * Math.random is stubbed to 0 (same as the other Transport specs) for deterministic seeding.
 */
test.describe('Budget — category search matching negative tests', () => {
  let budgets: BudgetsPage;

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0;
    });

    const factory = new PageFactory(page);
    budgets = factory.budgets();

    await factory.login().goto();
    await factory.login().loginAsDemo();
    await budgets.navigate();
  });

  test('a term longer than the category name ("Transports") does not match', async () => {
    // Substring match is one-directional: the category must contain the term.
    await budgets.searchCategories('Transports');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('a trailing space ("Transport ") is not trimmed and does not match', async () => {
    await budgets.searchCategories('Transport ');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('a misspelled term ("Transprot") does not match', async () => {
    await budgets.searchCategories('Transprot');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('non-contiguous letters of the name ("Trnsprt") do not match', async () => {
    // Matching is a contiguous substring, not a fuzzy/subsequence match.
    await budgets.searchCategories('Trnsprt');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('searching by the category icon does not match the Transport card', async () => {
    // The icon is rendered in the card but the filter only checks the category name.
    await budgets.searchCategories('🚗');

    await expect(budgets.transportCard).toHaveCount(0);
  });
});
