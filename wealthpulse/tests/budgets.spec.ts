import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await factory.budgets().navigate();
});

// ─── Edit a category budget amount ───────────────────────────────────────────

// The core write action in the Budgets module: changing a category's budget
// amount should immediately update the progress bar and remaining labels on
// that card, and the Total Budget KPI at the top.
test('editing the Food & Dining budget updates the card and Total Budget KPI', async ({ page }) => {
  const budgets = new PageFactory(page).budgets();

  // Wait for category cards to be visible
  const foodCard = page
    .locator('div')
    .filter({ hasText: /food & dining/i })
    .first();
  await expect(foodCard).toBeVisible();

  // Capture the Total Budget KPI text before editing
  const totalBudgetCard = page
    .locator('div')
    .filter({ hasText: /total budget/i })
    .first();
  const totalBefore = await totalBudgetCard.textContent();

  // Set a new budget amount for Food & Dining
  await budgets.setCategoryBudget('Food & Dining', '900');

  // The card should now reflect "$900" somewhere in its text
  await expect(foodCard).toContainText('900');

  // The Total Budget KPI should have changed
  const totalAfter = await totalBudgetCard.textContent();
  expect(totalAfter).not.toBe(totalBefore);
});

// Reducing a budget below the current spend should make the card visually
// indicate an over-budget state (red/warning styling or a negative remaining label).
test('setting budget below current spend shows over-budget indication', async ({ page }) => {
  // Food & Dining seeded spend is $485 — set budget to $100 to force over-budget
  const budgets = new PageFactory(page).budgets();

  await budgets.setCategoryBudget('Food & Dining', '100');

  // The card should contain a negative or warning indicator
  // (e.g. "-$385 remaining", a red class, or similar)
  const foodCard = page
    .locator('div')
    .filter({ hasText: /food & dining/i })
    .first();

  // Either the text contains a minus sign in the remaining amount, or
  // the progress bar element carries an "over-budget" / red class
  const cardText = await foodCard.textContent();
  const hasNegative = cardText?.includes('-') ?? false;
  const overBudgetEl = foodCard.locator('[class*="red"], [class*="over"], [class*="warning"]');
  const hasWarningClass = (await overBudgetEl.count()) > 0;

  expect(hasNegative || hasWarningClass).toBeTruthy();
});
