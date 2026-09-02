import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets — critical flow not yet covered by any existing test.
 *
 * Test 4: The search input filters the category cards in real time;
 *         only cards whose name matches the query are shown.
 *
 * Note: budget.comparison.spec.ts already covers month switching and KPI
 * recalculation, so those are intentionally omitted here to avoid duplication.
 */

test.describe('Budgets', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Navigate to Budgets
    const budgets = factory.budgets();
    await budgets.navigate();
  });

  // Test 4 — Search filters category cards
  test('searching for a category name shows only matching budget cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Verify all 8 categories are visible before searching
    const allCategories = page.locator('p.text-white.font-semibold.text-sm');
    await expect(allCategories).toHaveCount(8);

    // Search for "Housing" — only the Housing card should remain
    await budgets.searchCategories('Housing');

    // After filtering, only 1 card matching "Housing" should be visible
    await expect(allCategories).toHaveCount(1);
    await expect(allCategories.first()).toHaveText('Housing');

    // Clear the search — all 8 cards should return
    await budgets.searchCategories('');
    await expect(allCategories).toHaveCount(8);
  });
});
