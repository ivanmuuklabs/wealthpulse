import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

// All 8 seeded categories in WealthPulse
const ALL_CATEGORIES = [
  'Housing', 'Food', 'Transport', 'Entertainment',
  'Health', 'Utilities', 'Shopping', 'Subscriptions',
];

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await factory.budgets().navigate();
});

// Test 1 — Exact match: only the searched category card is shown
test('searching an exact category name shows only that category card', async ({ page }) => {
  const budgetsPage = new PageFactory(page).budgets();

  await budgetsPage.search('Housing');

  await expect(budgetsPage.budgetCards).toHaveCount(1);
  await expect(budgetsPage.getCategoryCard('Housing')).toBeVisible();
});

// Test 2 — Case-insensitive: lowercase input still matches correctly
test('search is case-insensitive and matches category cards regardless of casing', async ({ page }) => {
  const budgetsPage = new PageFactory(page).budgets();

  await budgetsPage.search('food');

  await expect(budgetsPage.budgetCards).toHaveCount(1);
  await expect(budgetsPage.getCategoryCard('Food')).toBeVisible();
});

// Test 3 — Partial match: substring that spans multiple categories
// "tion" matches: Entertainment, Subscriptions, Transport
test('searching a partial term shows all categories whose name contains that substring', async ({ page }) => {
  const budgetsPage = new PageFactory(page).budgets();

  await budgetsPage.search('tion');

  // Entertainment, Subscriptions and Transport all contain "tion"
  await expect(budgetsPage.budgetCards).toHaveCount(3);
  await expect(budgetsPage.getCategoryCard('Entertainment')).toBeVisible();
  await expect(budgetsPage.getCategoryCard('Subscriptions')).toBeVisible();
  await expect(budgetsPage.getCategoryCard('Transport')).toBeVisible();
});

// Test 4 — No match: a nonsense term hides all category cards
test('searching a term with no matching category hides all budget cards', async ({ page }) => {
  const budgetsPage = new PageFactory(page).budgets();

  await budgetsPage.search('xxxxxxxxnotacategory');

  await expect(budgetsPage.budgetCards).toHaveCount(0);
});

// Test 5 — Clear search: removing the search term restores all 8 category cards
test('clearing the search input restores all category cards', async ({ page }) => {
  const budgetsPage = new PageFactory(page).budgets();

  // First narrow down to one result
  await budgetsPage.search('Housing');
  await expect(budgetsPage.budgetCards).toHaveCount(1);

  // Then clear and confirm all categories are back
  await budgetsPage.clearSearch();
  await expect(budgetsPage.budgetCards).toHaveCount(ALL_CATEGORIES.length);
});
