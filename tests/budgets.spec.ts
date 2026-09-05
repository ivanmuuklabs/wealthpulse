import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets module tests.
 *
 * Coverage gap addressed:
 *   Test 4 — the category search input in the Budgets module filters the
 *             displayed budget cards to only those whose name contains the
 *             query string. No existing test covered this flow.
 *
 * Note: month switching and KPI recalculation are already covered in
 * tests/budget.comparison.spec.ts.
 */

test.describe('Budgets — category search', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to the Budgets section
    const budgetsPage = factory.budgets();
    await budgetsPage.navigate();
    // Wait for at least one budget card to be visible
    await expect(page.getByText('Total Budget')).toBeVisible();
  });

  // Test 4 — searching categories narrows the displayed budget cards
  test('searching for a category name shows only matching budget cards', async ({ page }) => {
    const budgetsPage = new PageFactory(page).budgets();

    // "Housing" is a known seeded category — searching for it should yield exactly one card
    await budgetsPage.searchCategories('Housing');

    // The Housing card must be visible
    await expect(page.getByText('Housing')).toBeVisible();

    // Cards for other categories (e.g. Food, Transport) must not be rendered
    await expect(page.getByText('Food')).not.toBeVisible();
    await expect(page.getByText('Transport')).not.toBeVisible();

    // Clearing the search restores all categories
    await budgetsPage.searchCategories('');

    // At least two other category names should be visible again
    await expect(page.getByText('Food')).toBeVisible();
    await expect(page.getByText('Transport')).toBeVisible();
  });
});
