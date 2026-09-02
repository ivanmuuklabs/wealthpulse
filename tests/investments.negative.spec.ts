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

// Negative Test 6 — Calculator rejects an investment amount below the $100 minimum
test('calculator with an amount below the $100 minimum produces a $0.00 or flat projection', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  await investmentsPage.goToSubTab('Calculator');

  // Enter an amount below the documented minimum of $100
  await investmentsPage.setCalculatorAmount(50);

  // The chart should not show a meaningful projection — all Y-axis ticks must be $0
  const tickTexts = await investmentsPage.calculatorYAxisTicks.allTextContents();
  const allZeroOrEmpty = tickTexts.every(t => t.includes('$0') || t.trim() === '');
  expect(allZeroOrEmpty).toBe(true);
});

// Negative Test 7 — Calculator at the minimum time horizon of 1 year renders only 2 data points
test('calculator with a 1-year time horizon renders the minimum two data points (Year 0 and Year 1)', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  await investmentsPage.goToSubTab('Calculator');

  // Set a valid investment amount and drag the horizon to its lower bound (1 year)
  await investmentsPage.setCalculatorAmount(1000);
  await investmentsPage.calculatorTimeHorizonSlider.fill('1');
  await investmentsPage.calculatorTimeHorizonSlider.dispatchEvent('input');

  // The area chart must be visible and the X-axis should have exactly 2 ticks: Year 0 and Year 1
  await expect(investmentsPage.calculatorAreaChart).toBeVisible();
  const xTicks = page.locator('.recharts-xAxis .recharts-cartesian-axis-tick-value');
  await expect(xTicks).toHaveCount(2);
});

// Negative Test 8 — Deselecting all chosen funds reverts Compare tab to empty state
test('deselecting all selected funds returns the Compare tab to its empty-state message', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  // Select two funds so the comparison chart appears
  await investmentsPage.selectFundCard(0);
  await investmentsPage.selectFundCard(1);

  // Deselect both funds by clicking them again
  await investmentsPage.selectFundCard(0);
  await investmentsPage.selectFundCard(1);

  // Navigate to Compare — the empty state placeholder must be visible, chart must be gone
  await investmentsPage.goToSubTab('Compare');
  await expect(investmentsPage.compareEmptyState).toBeVisible();
  await expect(investmentsPage.comparisonChart).not.toBeVisible();
});

// Negative Test 9 — Portfolio Builder with all sliders at 0% shows no donut chart
test('portfolio builder with all allocations at 0% hides the donut chart and flags total as invalid', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  await investmentsPage.goToSubTab('Portfolio Builder');

  // Ensure every slider is at 0 (default state; explicitly set the first two to be safe)
  await investmentsPage.setPortfolioSlider(0, 0);
  await investmentsPage.setPortfolioSlider(1, 0);

  // Total is 0% — not 100% — so the label should be styled as invalid (red)
  await expect(investmentsPage.portfolioTotalLabel).toHaveClass(/text-red-400/);

  // With no non-zero allocations there is nothing to render in the donut chart
  await expect(investmentsPage.portfolioDonutChart).not.toBeVisible();
});

// Negative Test 10 — Fund search is case-insensitive and returns the correct matches
test('fund search is case-insensitive and returns matching cards for an upper-case query', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  // Search using an all-uppercase term that matches at least one fund name/type/risk
  await investmentsPage.searchFunds('BOND');

  // At least one fund card should be visible — the search must not be case-sensitive
  const matchCount = await investmentsPage.fundCards.count();
  expect(matchCount).toBeGreaterThan(0);

  // Confirm the search does NOT return all 6 funds (i.e. the filter is actually applied)
  expect(matchCount).toBeLessThan(6);
});
