import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);

  const loginPage = factory.login();
  await loginPage.goto();
  await loginPage.loginAsDemo();

  const investmentsPage = factory.investments();
  await investmentsPage.navigate();
});

// Negative Test 1 — Search with no matching results shows no fund cards
test('search with a term that matches no fund hides all cards', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  await investmentsPage.searchFunds('xxxxxxxxnotafund');

  await expect(investmentsPage.fundCards).toHaveCount(0);
});

// Negative Test 2 — Selecting a 4th fund does NOT add it to the selection
test('selecting a 4th fund does not exceed the 3-fund selection limit', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  // Select 3 funds
  await investmentsPage.selectFundCard(0);
  await investmentsPage.selectFundCard(1);
  await investmentsPage.selectFundCard(2);

  // Attempt to select a 4th
  await investmentsPage.selectFundCard(3);

  // Only 3 should show the selected indicator
  await expect(investmentsPage.selectedBadges).toHaveCount(3);

  // The 4th card must NOT show the ring highlight
  await expect(investmentsPage.fundCards.nth(3)).not.toHaveClass(/ring-1/);
});

// Negative Test 3 — Compare tab shows empty state when no funds are selected
test('Compare tab shows empty state message when no funds are selected', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  await investmentsPage.goToSubTab('Compare');

  await expect(investmentsPage.compareEmptyState).toBeVisible();
  await expect(investmentsPage.comparisonChart).not.toBeVisible();
});

// Negative Test 4 — Calculator does not accept zero investment amounts
test('calculator with zero investment amount shows a $0.00 flat projection', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  await investmentsPage.goToSubTab('Calculator');
  await investmentsPage.setCalculatorAmount(0);

  const tickTexts = await investmentsPage.calculatorYAxisTicks.allTextContents();
  const allZero = tickTexts.every(t => t.includes('$0') || t === '$0.00');
  expect(allZero).toBe(true);
});

// Negative Test 5 — Portfolio Builder shows error state when total allocation exceeds 100%
test('portfolio builder flags total allocation above 100% as invalid', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  await investmentsPage.goToSubTab('Portfolio Builder');

  // Set two funds to 100% each — total becomes 200%
  await investmentsPage.setPortfolioSlider(0, 100);
  await investmentsPage.setPortfolioSlider(1, 100);

  await expect(investmentsPage.portfolioTotalLabel).toHaveClass(/text-red-400/);
  await expect(investmentsPage.portfolioTotalLabel).toContainText('must be 100%');
});
