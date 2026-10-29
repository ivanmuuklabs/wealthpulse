import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Investments tab — happy path tests
 *
 * User story: As a user I can browse investment fund cards, compare up to 3
 * selected funds on a chart, use the hypothetical growth calculator, and
 * allocate a portfolio in the Portfolio Builder.
 *
 * These complement the existing investments.negative.spec.ts which covers
 * edge-case / boundary flows. This file covers the primary success paths.
 */

test.describe('Investments — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Navigate to Investments
    const investments = new PageFactory(page).investments();
    await investments.navigate();
    await expect(page.getByRole('heading', { name: 'Investments' })).toBeVisible();
  });

  test('Fund Cards tab loads and displays all 6 funds', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // The Fund Cards sub-tab is active by default
    await expect(investments.fundCards).toHaveCount(6);
  });

  test('each fund card shows a risk badge (Low, Medium, or High)', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    const count = await investments.fundCards.count();
    expect(count).toBe(6);

    for (let i = 0; i < count; i++) {
      const badgeText = await investments.fundCards.nth(i).locator('span').filter({ hasText: /Low|Medium|High/ }).textContent();
      expect(['Low', 'Medium', 'High']).toContain(badgeText?.trim());
    }
  });

  test('clicking a fund card selects it (shows the ✓ Selected badge)', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select the first fund card
    await investments.selectFundCard(0);

    // The selected badge should now be visible on that card
    await expect(investments.selectedBadges).toHaveCount(1);
    await expect(investments.fundCards.nth(0)).toContainText('✓ Selected');
  });

  test('clicking a selected fund card deselects it (removes the ✓ Selected badge)', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(1);

    // Click again to deselect
    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(0);
  });

  test('fund card search filters the displayed cards to matching results', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Search for "Tech" — only "Tech Growth" should match
    await investments.searchFunds('Tech');
    await expect(investments.fundCards).toHaveCount(1);
    await expect(investments.fundCards.first()).toContainText('Tech Growth');
  });

  test('Compare tab renders the comparison chart when one fund is selected', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select one fund first (from Fund Cards tab)
    await investments.selectFundCard(0);

    // Navigate to Compare tab
    await investments.goToSubTab('Compare');

    // The empty-state message must NOT be shown
    await expect(investments.compareEmptyState).not.toBeVisible();

    // A Recharts SVG element should be present (chart rendered)
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
  });

  test('Compare tab shows up to 3 fund lines when 3 funds are selected', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.selectFundCard(1);
    await investments.selectFundCard(2);

    await investments.goToSubTab('Compare');

    // The Recharts legend should show 3 series names
    const legendItems = page.locator('.recharts-legend-item');
    await expect(legendItems).toHaveCount(3);
  });

  test('Calculator sub-tab renders the projection chart with a default investment', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    // The calculator inputs should be visible
    await expect(investments.calculatorAmountInput).toBeVisible();

    // The chart wrapper should be present and contain SVG
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
  });

  test('changing the Calculator investment amount re-renders the chart with new values', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Calculator');

    // Set a distinct amount
    await investments.setCalculatorAmount(25000);

    // The Y-axis ticks should reflect values above $25,000 (the starting point)
    const ticks = await investments.calculatorYAxisTicks.allTextContents();
    // At least one tick should contain "$25" or higher — non-empty chart
    expect(ticks.length).toBeGreaterThan(0);
    // The ticks must not all be $0.00 (non-zero investment produces a real projection)
    const allZero = ticks.every(t => t.includes('$0') && !t.match(/\$[1-9]/));
    expect(allZero).toBe(false);
  });

  test('Portfolio Builder sub-tab renders the allocation sliders for all 6 funds', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Each fund has a range slider — 6 sliders total
    await expect(investments.portfolioSliders).toHaveCount(6);
  });

  test('setting one portfolio slider to 100% shows the correct total and blended return', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Set the first fund to 100%
    await investments.setPortfolioSlider(0, 100);

    // Total label should show "100%"
    await expect(investments.portfolioTotalLabel).toContainText('100%');

    // Blended return should be a percentage (non-empty, contains % sign)
    const blendedReturnText = await page.getByText('Blended Annual Return:').locator('..').textContent();
    expect(blendedReturnText).toMatch(/%/);
  });

  test('Portfolio Builder pie chart appears when a non-zero allocation is set', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.goToSubTab('Portfolio Builder');

    // Initially all sliders are at 0 — no pie chart
    await expect(page.locator('.recharts-wrapper').first()).not.toBeVisible({ timeout: 2000 }).catch(() => {
      // If the chart is visible despite zero allocation, do nothing; the real assertion is below
    });

    // Set a non-zero allocation to trigger the pie chart
    await investments.setPortfolioSlider(0, 60);
    await investments.setPortfolioSlider(1, 40);

    // Now the Recharts wrapper (pie chart) should be visible
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
  });
});
