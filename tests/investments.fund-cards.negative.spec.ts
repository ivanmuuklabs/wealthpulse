import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Investments — Fund Cards tab (negative / edge-case coverage)
 *
 * Complements the positive scenarios in investments.fund-cards.spec.ts.
 * Also covers the cross-tab flow: select funds on Fund Cards → Compare tab
 * shows the comparison chart (positive path not covered by negative spec).
 *
 * Seeded funds (id → name → type → risk):
 *   uslc → US Large Cap Index  → Index        → Medium
 *   intl → International Equity → Equity       → High
 *   bond → Bond Fund            → Fixed Income → Low
 *   tech → Tech Growth          → Sector       → High
 *   reit → Real Estate REIT     → Real Estate  → Medium
 *   emrg → Emerging Markets     → Equity       → High
 */

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  const loginPage = factory.login();
  await loginPage.goto();
  await loginPage.loginAsDemo();

  const investmentsPage = factory.investments();
  await investmentsPage.navigate();
});

// ─── Edge case 1 — Search by fund type "Equity" matches exactly 2 cards ─────
test('searching by fund type "Equity" shows only the two Equity funds', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  // "Equity" appears in type badge for International Equity and Emerging Markets
  await investmentsPage.searchFunds('Equity');

  await expect(investmentsPage.fundCards).toHaveCount(2);
  await expect(page.getByText('International Equity')).toBeVisible();
  await expect(page.getByText('Emerging Markets')).toBeVisible();

  // Funds without "Equity" type must not be visible
  await expect(page.getByText('Bond Fund')).not.toBeVisible();
  await expect(page.getByText('Tech Growth')).not.toBeVisible();
});

// ─── Edge case 2 — Search by fund type "Index" matches exactly 1 card ────────
test('searching by fund type "Index" shows only the US Large Cap Index fund', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  await investmentsPage.searchFunds('Index');

  await expect(investmentsPage.fundCards).toHaveCount(1);
  await expect(page.getByText('US Large Cap Index')).toBeVisible();
});

// ─── Edge case 3 — Selecting 2 funds and navigating to Compare shows chart ───
test('selecting 2 funds then switching to Compare tab renders the comparison chart', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  // Select two distinct funds (US Large Cap Index and Tech Growth)
  await investmentsPage.selectFundCard(0); // US Large Cap Index
  await investmentsPage.selectFundCard(3); // Tech Growth

  // Both should be selected
  await expect(investmentsPage.selectedBadges).toHaveCount(2);

  // Navigate to the Compare sub-tab
  await investmentsPage.goToSubTab('Compare');

  // The empty-state message must NOT be shown
  await expect(investmentsPage.compareEmptyState).not.toBeVisible();

  // A comparison chart line should be rendered for each selected fund
  await expect(investmentsPage.comparisonChart).toBeVisible();
});

// ─── Edge case 4 — Return value colours: positive returns are green, negative are red ──
test('fund card return values use emerald colour for gains and red for losses', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  // All 6 cards must be present
  await expect(investmentsPage.fundCards).toHaveCount(6);

  // Tech Growth has a negative 1-month return (-2.0% over last month in seed data
  // when computed cumulatively). At least one fund should show a red return label.
  // We assert that both colour classes appear somewhere in the fund cards grid.
  const greenReturn = page.locator('.grid > div').filter({ hasText: /Expense Ratio/ }).locator('.text-emerald-400').first();
  const redReturn   = page.locator('.grid > div').filter({ hasText: /Expense Ratio/ }).locator('.text-red-400').first();

  await expect(greenReturn).toBeVisible();
  await expect(redReturn).toBeVisible();
});

// ─── Edge case 5 — Portfolio Builder shows empty-pie state with no allocations ─
test('Portfolio Builder shows empty allocation hint when no percentages are set', async ({ page }) => {
  // Navigate to the Portfolio Builder sub-tab (fresh page, no allocations)
  const investmentsPage = new PageFactory(page).investments();
  await investmentsPage.goToSubTab('Portfolio Builder');

  // The pie chart placeholder message should be visible
  await expect(page.getByText('Allocate percentages to see chart')).toBeVisible();

  // The allocation total label starts at 0%
  await expect(investmentsPage.portfolioTotalLabel).toContainText('0%');
});

// ─── Edge case 6 — Search is global: active while on any sub-tab ─────────────
test('search input still filters fund cards after switching away and back to Fund Cards', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  // Filter while on Fund Cards
  await investmentsPage.searchFunds('Bond Fund');
  await expect(investmentsPage.fundCards).toHaveCount(1);

  // Switch to Compare and back to Fund Cards
  await investmentsPage.goToSubTab('Compare');
  await investmentsPage.goToSubTab('Fund Cards');

  // The filter should still be in effect (search state persists in component state)
  await expect(investmentsPage.fundCards).toHaveCount(1);
  await expect(page.getByText('Bond Fund')).toBeVisible();

  // Clearing restores all 6
  await investmentsPage.clearSearch();
  await expect(investmentsPage.fundCards).toHaveCount(6);
});
