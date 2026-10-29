import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Investments — Fund Cards tab (positive coverage)
 *
 * The 6 funds seeded in the app:
 *   - US Large Cap Index  (Index,        Medium risk)
 *   - International Equity (Equity,      High risk)
 *   - Bond Fund           (Fixed Income, Low risk)
 *   - Tech Growth         (Sector,       High risk)
 *   - Real Estate REIT    (Real Estate,  Medium risk)
 *   - Emerging Markets    (Equity,       High risk)
 */

const TOTAL_FUNDS = 6;

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  const loginPage = factory.login();
  await loginPage.goto();
  await loginPage.loginAsDemo();

  const investmentsPage = factory.investments();
  await investmentsPage.navigate();
});

// ─── Test 1 — All 6 fund cards load with required data fields ───────────────
test('Fund Cards tab renders all 6 fund cards with name, risk badge, expense ratio, and returns', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  // All 6 cards must be present
  await expect(investmentsPage.fundCards).toHaveCount(TOTAL_FUNDS);

  // Spot-check that specific fund names are visible
  await expect(page.getByText('US Large Cap Index')).toBeVisible();
  await expect(page.getByText('Tech Growth')).toBeVisible();
  await expect(page.getByText('Bond Fund')).toBeVisible();

  // Every card must show an Expense Ratio value
  await expect(investmentsPage.expenseRatios).toHaveCount(TOTAL_FUNDS);

  // At least one risk badge must be visible
  const riskBadge = page.locator('text=/Low|Medium|High/').first();
  await expect(riskBadge).toBeVisible();

  // Return period labels should be present on the page
  await expect(page.getByText('1M').first()).toBeVisible();
  await expect(page.getByText('3M').first()).toBeVisible();
  await expect(page.getByText('12M').first()).toBeVisible();
});

// ─── Test 2 — Selecting a fund highlights it with an emerald border and "Selected" badge ──
test('clicking a fund card marks it as selected with a "✓ Selected" badge', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  // No badges before any selection
  await expect(investmentsPage.selectedBadges).toHaveCount(0);

  // Select the first fund card
  await investmentsPage.selectFundCard(0);

  // One "✓ Selected" badge must appear
  await expect(investmentsPage.selectedBadges).toHaveCount(1);

  // The selected card must carry the emerald ring class
  await expect(investmentsPage.fundCards.nth(0)).toHaveClass(/ring-1/);
});

// ─── Test 3 — Deselecting a fund removes its highlight and badge ─────────────
test('clicking a selected fund card deselects it and removes the badge', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  // Select then immediately deselect the first card
  await investmentsPage.selectFundCard(0);
  await expect(investmentsPage.selectedBadges).toHaveCount(1);

  await investmentsPage.selectFundCard(0);

  // Badge and ring must both be gone
  await expect(investmentsPage.selectedBadges).toHaveCount(0);
  await expect(investmentsPage.fundCards.nth(0)).not.toHaveClass(/ring-1/);
});

// ─── Test 4 — Searching by fund name filters cards correctly ─────────────────
test('searching by fund name shows only matching fund cards', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  // Search for a fund name that matches exactly one card
  await investmentsPage.searchFunds('Tech Growth');

  // Only 1 card should remain visible
  await expect(investmentsPage.fundCards).toHaveCount(1);
  await expect(page.getByText('Tech Growth')).toBeVisible();

  // Unrelated funds must not be present
  await expect(page.getByText('Bond Fund')).not.toBeVisible();
  await expect(page.getByText('US Large Cap Index')).not.toBeVisible();
});

// ─── Test 5 — Searching by risk level filters cards correctly ────────────────
test('searching by risk level "Low" shows only the Bond Fund card', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  // "Low" risk matches only the Bond Fund among the 6 seeded funds
  await investmentsPage.searchFunds('Low');

  await expect(investmentsPage.fundCards).toHaveCount(1);
  await expect(page.getByText('Bond Fund')).toBeVisible();
});

// ─── Test 6 — Clearing search restores all 6 fund cards ─────────────────────
test('clearing the search input after filtering restores all fund cards', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  // Filter down to one result …
  await investmentsPage.searchFunds('Tech Growth');
  await expect(investmentsPage.fundCards).toHaveCount(1);

  // … then clear, and all 6 should come back
  await investmentsPage.clearSearch();
  await expect(investmentsPage.fundCards).toHaveCount(TOTAL_FUNDS);
});
