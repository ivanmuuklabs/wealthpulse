import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';

/**
 * Budgets category search — extra negative tests complementing the happy cases added in PR #70
 * and the existing budget.transport.search.matching.negative.spec.ts / budget.transport.search.negative.spec.ts
 * (which already cover "Transports", "Transport ", "Transprot", "Trnsprt", icon, "Food", " ", ".*", "Uber").
 *
 * App behavior relied on (per the existing specs' comments describing BudgetsTab in src/App.jsx; src/App.jsx
 * was not read directly): cards are filtered with a case-insensitive, contiguous, untrimmed substring match
 * on the category name only.
 *
 * Math.random is stubbed to 0 (same as the other Transport specs) for deterministic seeding.
 */
test.describe('Budget — category search matching extra negative tests', () => {
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

  test('a leading space (" Transport") is not trimmed and does not match', async () => {
    await budgets.searchCategories(' Transport');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('a space inside the name (\"Trans port\") does not match', async () => {
    await budgets.searchCategories('Trans port');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('a hyphen inside the name (\"Trans-port\") does not match', async () => {
    await budgets.searchCategories('Trans-port');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('SQL-like wildcard characters (\"Transport%\") are treated literally and do not match', async () => {
    await budgets.searchCategories('Transport%');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('appending a character to a matching term (\"Transport\" -> \"Transportx\") hides the card', async () => {
    await budgets.searchCategories('Transport');
    await expect(budgets.transportCard).toBeVisible();

    await budgets.searchCategories('Transportx');

    await expect(budgets.transportCard).toHaveCount(0);
  });
});
