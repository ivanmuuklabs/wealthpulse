import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await factory.budgets().navigate();
});

// ─── Budgets — category search filter ────────────────────────────────────────

// Typing a category name into the search box on the Budgets page should
// filter the grid so only matching category cards remain visible.
test('searching for a category name filters the budget cards', async ({ page }) => {
  // All 8 category cards should be visible on load
  // (each card contains a progress bar and spend/budget info)
  const allCards = page.locator('div').filter({ hasText: /housing|food|transport|entertainment|health|utilities|shopping|subscriptions/i });

  // The search input on the Budgets page
  const searchInput = page.getByPlaceholder(/search categories/i);
  await expect(searchInput).toBeVisible();

  // Search for "Transport"
  await searchInput.fill('Transport');

  // Transport card must be visible
  const transportCard = page.locator('div').filter({ hasText: /transport/i }).first();
  await expect(transportCard).toBeVisible();

  // Categories that don't match "Transport" should not be present
  // (Housing, Food, etc. should be hidden)
  const housingCard = page.locator('div').filter({ hasText: /^housing$/i });
  await expect(housingCard).toHaveCount(0);
});

// Clearing the search restores all category cards
test('clearing the category search restores all budget cards', async ({ page }) => {
  const searchInput = page.getByPlaceholder(/search categories/i);
  await expect(searchInput).toBeVisible();

  // Filter to a single category
  await searchInput.fill('Health');

  // Health card is visible
  const healthCard = page.locator('div').filter({ hasText: /health/i }).first();
  await expect(healthCard).toBeVisible();

  // Clear the search
  await searchInput.clear();

  // All standard categories should be visible again — spot-check Housing and Food
  const housingCard = page
    .locator('div')
    .filter({ hasText: /housing/i })
    .first();
  const foodCard = page
    .locator('div')
    .filter({ hasText: /food/i })
    .first();
  await expect(housingCard).toBeVisible();
  await expect(foodCard).toBeVisible();
});

// Searching with a non-matching term shows no cards
test('searching with a non-matching term hides all budget cards', async ({ page }) => {
  const searchInput = page.getByPlaceholder(/search categories/i);
  await expect(searchInput).toBeVisible();

  await searchInput.fill('zzz_no_match_zzz');

  // None of the 8 known category names should be visible
  const knownCats = ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Shopping', 'Subscriptions'];
  for (const cat of knownCats) {
    // Strict text match to avoid false positives from partial matches
    await expect(page.locator(`text="${cat}"`)).toHaveCount(0);
  }
});

// ─── Budgets — month switching ────────────────────────────────────────────────

// The Budgets tab has Jan/Feb/Mar month buttons that update which month's
// transactions are used to calculate spend for each category card.
// Switching months should change the "spent of budget" text in at least one
// category card (seeded data differs across months).
test('switching months on the Budgets page updates the spend figures', async ({ page }) => {
  // Capture the Total Spent KPI value in the default month (March)
  const totalSpentCard = page
    .locator('div')
    .filter({ hasText: /total spent/i })
    .first();
  await expect(totalSpentCard).toBeVisible();
  const marchTotal = await totalSpentCard.textContent();

  // Switch to January
  await page.getByRole('button', { name: 'Jan' }).click();

  // The Total Spent figure should update (seeded Jan and Mar data differs)
  const janTotal = await totalSpentCard.textContent();
  expect(janTotal).not.toBe(marchTotal);

  // The Budgets page heading should still be visible after the switch
  await expect(page.locator('h2').filter({ hasText: /budgets/i })).toBeVisible();
});

// Switching back to March restores the original spend values
test('switching from January back to March restores the March spend figures', async ({ page }) => {
  const totalSpentCard = page
    .locator('div')
    .filter({ hasText: /total spent/i })
    .first();
  await expect(totalSpentCard).toBeVisible();
  const marchTotal = await totalSpentCard.textContent();

  // Switch to January and back to March
  await page.getByRole('button', { name: 'Jan' }).click();
  await page.getByRole('button', { name: 'Mar' }).click();

  const restoredTotal = await totalSpentCard.textContent();
  expect(restoredTotal).toBe(marchTotal);
});
