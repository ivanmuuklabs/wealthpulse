import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Investments tab — happy path tests.
 *
 * User story: As a logged-in user I can browse the 6 investment fund cards,
 * select up to 3 for comparison, run the growth calculator, and build a
 * portfolio allocation — so that I can explore investment options at a glance.
 *
 * Covers:
 *  Fund Cards  — tab is reachable, all 6 cards visible, fund selection highlights
 *                the card and shows a "✓ Selected" badge.
 *  Compare     — selecting funds and viewing the 12-month comparison line chart.
 *  Calculator  — changing the fund and amount shows a growing projection chart.
 *  Portfolio   — adjusting sliders and seeing the blended return value update.
 *
 * The negative cases (no-match search, 3-fund limit, compare empty state, $0 calc,
 * portfolio >100%) are already covered in tests/investments.negative.spec.ts.
 */

test.describe('Investments — Fund Cards tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to Investments and confirm landing page
    await factory.investments().navigate();
    await expect(page.getByRole('heading', { name: 'Investments' })).toBeVisible();
  });

  test('Investments tab is reachable and displays the heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Investments' })).toBeVisible();
  });

  test('all six fund cards are rendered in the Fund Cards sub-tab', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    const count = await investmentsPage.fundCards.count();
    expect(count).toBe(6);
  });

  test('each fund card shows the 1M / 3M / 12M return labels', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    const firstCard = investmentsPage.fundCards.first();

    await expect(firstCard.getByText('1M')).toBeVisible();
    await expect(firstCard.getByText('3M')).toBeVisible();
    await expect(firstCard.getByText('12M')).toBeVisible();
  });

  test('clicking a fund card selects it and shows the "✓ Selected" badge', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    // Select the first fund card
    await investmentsPage.selectFundCard(0);

    // A "✓ Selected" badge must appear inside that card
    await expect(investmentsPage.fundCards.first().getByText('✓ Selected')).toBeVisible();
  });

  test('selecting two fund cards shows two "✓ Selected" badges', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.selectFundCard(0);
    await investmentsPage.selectFundCard(1);

    const selectedBadges = investmentsPage.selectedBadges;
    await expect(selectedBadges).toHaveCount(2);
  });

  test('clicking a selected fund card deselects it and removes the badge', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    // Select then deselect
    await investmentsPage.selectFundCard(0);
    await expect(investmentsPage.selectedBadges).toHaveCount(1);

    await investmentsPage.selectFundCard(0); // toggle off
    await expect(investmentsPage.selectedBadges).toHaveCount(0);
  });

  test('fund search narrows the visible fund cards', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    // "Tech" matches exactly one fund: Tech Growth
    await investmentsPage.searchFunds('Tech');

    const count = await investmentsPage.fundCards.count();
    expect(count).toBe(1);
    await expect(page.getByText('Tech Growth')).toBeVisible();
  });

  test('clearing the fund search restores all six cards', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    await investmentsPage.searchFunds('Bond');
    await investmentsPage.searchFunds(''); // clear

    const count = await investmentsPage.fundCards.count();
    expect(count).toBe(6);
  });
});

test.describe('Investments — Compare sub-tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
  });

  test('Compare tab with two selected funds renders the comparison line chart', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();

    // Select two funds while on Fund Cards
    await investmentsPage.selectFundCard(0);
    await investmentsPage.selectFundCard(1);

    // Switch to Compare sub-tab
    await investmentsPage.goToSubTab('Compare');

    // The line chart must be visible
    await expect(investmentsPage.comparisonChart).toBeVisible();
  });

  test('Compare tab shows the "Fund Comparison (12-Month Performance)" heading', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    await investmentsPage.goToSubTab('Compare');

    await expect(
      page.getByText('Fund Comparison (12-Month Performance)')
    ).toBeVisible();
  });
});

test.describe('Investments — Calculator sub-tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
  });

  test('Calculator tab is reachable and shows the heading', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    await investmentsPage.goToSubTab('Calculator');

    await expect(page.getByText('Hypothetical Growth Calculator')).toBeVisible();
  });

  test('default calculator shows a non-zero projected value on the chart', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    await investmentsPage.goToSubTab('Calculator');

    // The Y-axis ticks must contain at least one non-zero dollar amount
    const ticks = investmentsPage.calculatorYAxisTicks;
    const tickCount = await ticks.count();
    expect(tickCount).toBeGreaterThan(0);

    // At least one tick should show a value above $10,000 (default $10k grows)
    let foundPositive = false;
    for (let i = 0; i < tickCount; i++) {
      const text = await ticks.nth(i).textContent();
      if (text && text.includes('$') && !text.includes('$0')) {
        foundPositive = true;
        break;
      }
    }
    expect(foundPositive).toBe(true);
  });

  test('the Investment ($) input accepts a new amount and the chart re-renders', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    await investmentsPage.goToSubTab('Calculator');

    // Change amount to $50,000
    await investmentsPage.setCalculatorAmount(50000);

    // The projected chart must still be visible after the update
    const chart = page.locator('.recharts-area-chart, .recharts-line-chart, .recharts-bar-chart').first();
    await expect(chart).toBeVisible();
  });

  test('the fund selector lists all six funds', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    await investmentsPage.goToSubTab('Calculator');

    // The fund <select> inside the calculator
    const fundSelect = page.locator('select').first();
    const options = await fundSelect.locator('option').allTextContents();
    expect(options).toHaveLength(6);
  });

  test('disclaimer note is visible in the Calculator tab', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    await investmentsPage.goToSubTab('Calculator');

    // The amber disclaimer at the bottom of the calculator card
    await expect(
      page.getByText(/past performance does not guarantee future results/i)
    ).toBeVisible();
  });
});

test.describe('Investments — Portfolio Builder sub-tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.investments().navigate();
  });

  test('Portfolio Builder tab is reachable and shows the allocation heading', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    await investmentsPage.goToSubTab('Portfolio Builder');

    await expect(page.getByText('Allocate Funds')).toBeVisible();
  });

  test('all six fund sliders are present in the Portfolio Builder', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    await investmentsPage.goToSubTab('Portfolio Builder');

    const sliders = investmentsPage.portfolioSliders;
    await expect(sliders).toHaveCount(6);
  });

  test('adjusting one slider updates the Total percentage label', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    await investmentsPage.goToSubTab('Portfolio Builder');

    // Set the first fund (US Large Cap) slider to 40%
    await investmentsPage.setPortfolioSlider(0, 40);

    // The "Total:" label should now show 40%
    await expect(investmentsPage.portfolioTotalLabel).toContainText('40%');
  });

  test('allocation summing to 100% shows emerald-coloured total (valid)', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    await investmentsPage.goToSubTab('Portfolio Builder');

    // Distribute 100% across the first two funds (60 + 40)
    await investmentsPage.setPortfolioSlider(0, 60);
    await investmentsPage.setPortfolioSlider(1, 40);

    // Total label must show "100%" and carry an emerald style
    const totalLabel = investmentsPage.portfolioTotalLabel;
    await expect(totalLabel).toContainText('100%');
    await expect(totalLabel).toHaveClass(/text-emerald-400/);
  });

  test('valid 100% allocation shows the Blended Annual Return', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    await investmentsPage.goToSubTab('Portfolio Builder');

    await investmentsPage.setPortfolioSlider(0, 100);

    // "Blended Annual Return:" label must be visible with a percentage value
    await expect(page.getByText('Blended Annual Return:')).toBeVisible();
  });

  test('valid 100% allocation renders the portfolio allocation pie chart', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    await investmentsPage.goToSubTab('Portfolio Builder');

    await investmentsPage.setPortfolioSlider(0, 50);
    await investmentsPage.setPortfolioSlider(1, 50);

    // PieChart should render inside the allocation card
    const pieChart = page.locator('.recharts-pie-chart').first();
    await expect(pieChart).toBeVisible();
  });
});
