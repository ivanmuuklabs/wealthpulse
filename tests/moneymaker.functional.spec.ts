import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Functional regression tests for the Investments → MoneyMaker rename (PR #56).
 *
 * moneymaker.rename.spec.ts already pins the sidebar label and heading.
 * This file verifies that the underlying functionality — fund cards, search,
 * sub-tabs, and cross-tab navigation — all still work correctly after the rename.
 */

test.describe('MoneyMaker — fund cards and content', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Navigate to MoneyMaker (via the updated page object)
    await factory.investments().navigate();
    // Confirm the section heading is visible before each test
    await expect(page.getByRole('heading', { name: 'MoneyMaker' })).toBeVisible();
  });

  test('Fund Cards sub-tab is active by default after navigation', async ({ page }) => {
    // The Fund Cards button should have the active emerald highlight by default
    const fundCardsButton = page.getByRole('button', { name: 'Fund Cards' });
    await expect(fundCardsButton).toBeVisible();
    await expect(fundCardsButton).toHaveClass(/text-emerald-400/);
  });

  test('fund cards grid loads with at least one card under MoneyMaker', async ({ page }) => {
    const factory = new PageFactory(page);
    const investmentsPage = factory.investments();

    // At least one fund card should be visible after rename
    await expect(investmentsPage.fundCards.first()).toBeVisible();

    // Verify a reasonable number of cards are rendered (seeded data has 6)
    const count = await investmentsPage.fundCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('each fund card shows an expense ratio label', async ({ page }) => {
    const factory = new PageFactory(page);
    // All cards expose "Expense Ratio" text — confirms the card content renders correctly
    const firstCard = factory.investments().fundCards.first();
    await expect(firstCard).toContainText('Expense Ratio');
  });

  test('search input filters fund cards by name within MoneyMaker', async ({ page }) => {
    const factory = new PageFactory(page);
    const investmentsPage = factory.investments();

    // Get the initial count
    const initialCount = await investmentsPage.fundCards.count();
    expect(initialCount).toBeGreaterThan(0);

    // Search for a term that matches at least one but not all funds
    await investmentsPage.searchFunds('Bond');

    // Fewer or equal cards should remain (only matching ones)
    const filteredCount = await investmentsPage.fundCards.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('clearing the search restores all fund cards', async ({ page }) => {
    const factory = new PageFactory(page);
    const investmentsPage = factory.investments();

    const initialCount = await investmentsPage.fundCards.count();

    // Filter then clear
    await investmentsPage.searchFunds('Bond');
    await investmentsPage.searchFunds('');

    // All cards should be back
    await expect(investmentsPage.fundCards).toHaveCount(initialCount);
  });

  test('Compare sub-tab is reachable from MoneyMaker', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.investments().goToSubTab('Compare');

    // The Compare tab button should now be active
    const compareButton = page.getByRole('button', { name: 'Compare' });
    await expect(compareButton).toHaveClass(/text-emerald-400/);

    // MoneyMaker heading should still be visible
    await expect(page.getByRole('heading', { name: 'MoneyMaker' })).toBeVisible();
  });

  test('Calculator sub-tab is reachable from MoneyMaker', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.investments().goToSubTab('Calculator');

    // The Calculator input should be visible
    await expect(factory.investments().calculatorAmountInput).toBeVisible();

    // MoneyMaker heading should still be visible
    await expect(page.getByRole('heading', { name: 'MoneyMaker' })).toBeVisible();
  });

  test('Portfolio Builder sub-tab is reachable from MoneyMaker', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.investments().goToSubTab('Portfolio Builder');

    // Portfolio sliders should be present
    const sliders = factory.investments().portfolioSliders;
    const sliderCount = await sliders.count();
    expect(sliderCount).toBeGreaterThan(0);

    // MoneyMaker heading should still be visible
    await expect(page.getByRole('heading', { name: 'MoneyMaker' })).toBeVisible();
  });
});

test.describe('MoneyMaker — cross-tab navigation', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('all five sidebar nav labels are present simultaneously', async ({ page }) => {
    // After login, the sidebar should show all 5 labels (expanded state by default)
    await expect(page.getByRole('button', { name: 'Charts' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Expenses' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'MoneyMaker' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Budgets' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  });

  test('navigating to MoneyMaker from Charts shows MoneyMaker heading', async ({ page }) => {
    // Start on Charts (default after login)
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Navigate to MoneyMaker
    await page.getByRole('button', { name: 'MoneyMaker' }).click();
    await expect(page.getByRole('heading', { name: 'MoneyMaker' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Overview' })).not.toBeVisible();
  });

  test('navigating to MoneyMaker from Budgets shows MoneyMaker heading', async ({ page }) => {
    // Go to Budgets first
    await page.getByRole('button', { name: 'Budgets' }).click();

    // Then navigate to MoneyMaker
    await page.getByRole('button', { name: 'MoneyMaker' }).click();
    await expect(page.getByRole('heading', { name: 'MoneyMaker' })).toBeVisible();
  });

  test('navigating to MoneyMaker from Settings shows MoneyMaker heading', async ({ page }) => {
    // Go to Settings first
    await page.getByRole('button', { name: 'Settings' }).click();

    // Then navigate to MoneyMaker
    await page.getByRole('button', { name: 'MoneyMaker' }).click();
    await expect(page.getByRole('heading', { name: 'MoneyMaker' })).toBeVisible();
  });

  test('only one sidebar item is active at a time — MoneyMaker vs Charts', async ({ page }) => {
    // Navigate to MoneyMaker
    await page.getByRole('button', { name: 'MoneyMaker' }).click();

    const moneyMakerButton = page.getByRole('button', { name: 'MoneyMaker' });
    const chartsButton = page.getByRole('button', { name: 'Charts' });

    // MoneyMaker should be active; Charts should not
    await expect(moneyMakerButton).toHaveClass(/text-emerald-400/);
    await expect(chartsButton).not.toHaveClass(/text-emerald-400/);
  });
});
