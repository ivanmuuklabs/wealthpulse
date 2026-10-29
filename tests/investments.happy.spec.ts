import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Investments tab.
 *
 * User stories:
 *  - As a user I can browse 6 investment fund cards and see their risk,
 *    returns, expense ratio, and a sparkline chart.
 *  - As a user I can select up to 3 funds and compare their 12-month
 *    cumulative returns in a line chart.
 *  - As a user I can use the Hypothetical Growth Calculator to project
 *    the value of an investment over time.
 *  - As a user I can allocate portfolio percentages across funds and see
 *    a donut chart and a blended annual return.
 *
 * Seeded facts (from App.jsx):
 *  - 6 funds: US Large Cap Index, International Equity, Bond Fund, Tech Growth,
 *    Real Estate REIT, Emerging Markets.
 *  - Risk levels: Low (Bond Fund), Medium (US Large Cap, REIT), High (others).
 *  - Monthly Income constant = $6,500.
 */

test.describe('Investments — Fund Cards', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const investments = factory.investments();
    await investments.navigate();
    // Default sub-tab is "Fund Cards"
    await expect(page.getByRole('heading', { name: 'Investments' })).toBeVisible();
  });

  test('all 6 fund cards are visible by default', async ({ page }) => {
    const investments = new PageFactory(page).investments();
    await expect(investments.fundCards).toHaveCount(6);
  });

  test('each fund card shows a risk badge (Low / Medium / High)', async ({ page }) => {
    // At least one Low, one Medium, and one High badge exist
    await expect(page.getByText('Low').first()).toBeVisible();
    await expect(page.getByText('Medium').first()).toBeVisible();
    await expect(page.getByText('High').first()).toBeVisible();
  });

  test('each fund card shows the Expense Ratio label', async ({ page }) => {
    const ratioLabels = page.getByText(/Expense Ratio:/);
    // One per card → 6 total
    await expect(ratioLabels).toHaveCount(6);
  });

  test('selecting a fund card shows the "✓ Selected" badge', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await expect(investments.selectedBadges).toHaveCount(1);
  });

  test('selecting and deselecting a fund removes the "✓ Selected" badge', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(1);
    await expect(investments.selectedBadges).toHaveCount(1);

    // Click again to deselect
    await investments.selectFundCard(1);
    await expect(investments.selectedBadges).toHaveCount(0);
  });

  test('selecting 3 funds shows 3 "✓ Selected" badges', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.selectFundCard(1);
    await investments.selectFundCard(2);

    await expect(investments.selectedBadges).toHaveCount(3);
  });

  test('searching for "Bond" narrows the fund list to 1 card', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.searchFunds('Bond');
    await expect(investments.fundCards).toHaveCount(1);
    await expect(page.getByText('Bond Fund')).toBeVisible();
  });

  test('searching for "Index" shows only US Large Cap Index card', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.searchFunds('Index');
    await expect(investments.fundCards).toHaveCount(1);
    await expect(page.getByText('US Large Cap Index')).toBeVisible();
  });

  test('clearing the search restores all 6 fund cards', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.searchFunds('Tech');
    await expect(investments.fundCards).toHaveCount(1);

    await investments.searchFunds('');
    await expect(investments.fundCards).toHaveCount(6);
  });

  test('fund cards show 1M, 3M and 12M return percentages', async ({ page }) => {
    // Labels are present for the first card at minimum
    await expect(page.getByText('1M').first()).toBeVisible();
    await expect(page.getByText('3M').first()).toBeVisible();
    await expect(page.getByText('12M').first()).toBeVisible();
  });
});

test.describe('Investments — Compare tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const investments = factory.investments();
    await investments.navigate();
  });

  test('Compare tab shows the empty-state prompt when no funds are selected', async ({ page }) => {
    const investments = new PageFactory(page).investments();
    await investments.goToSubTab('Compare');

    await expect(investments.compareEmptyState).toBeVisible();
  });

  test('selecting a fund then switching to Compare renders the fund name in the chart legend', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Select US Large Cap Index (index 0)
    await investments.selectFundCard(0);
    await investments.goToSubTab('Compare');

    // Recharts renders the legend; the fund name should appear
    await expect(page.getByText('US Large Cap Index')).toBeVisible();
  });

  test('two selected funds appear as two legend entries in Compare', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.selectFundCard(0);
    await investments.selectFundCard(1);
    await investments.goToSubTab('Compare');

    await expect(page.getByText('US Large Cap Index')).toBeVisible();
    await expect(page.getByText('International Equity')).toBeVisible();
  });

  test('Compare tab heading is visible', async ({ page }) => {
    const investments = new PageFactory(page).investments();
    await investments.goToSubTab('Compare');

    await expect(page.getByText('Fund Comparison (12-Month Performance)')).toBeVisible();
  });
});

test.describe('Investments — Calculator tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const investments = factory.investments();
    await investments.navigate();
    await investments.goToSubTab('Calculator');
  });

  test('Calculator heading is visible', async ({ page }) => {
    await expect(page.getByText('Hypothetical Growth Calculator')).toBeVisible();
  });

  test('the Fund selector, Investment amount, and Time Horizon controls are present', async ({ page }) => {
    await expect(page.getByText('Fund')).toBeVisible();
    await expect(page.getByText('Investment ($)')).toBeVisible();
    await expect(page.getByText('Time Horizon (years)')).toBeVisible();
  });

  test('the chart renders with a default $10,000 investment', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Default amount is 10000 — the Y-axis should show a dollar tick ≥ $10,000
    await expect(investments.calculatorAmountInput).toHaveValue('10000');
    // A Recharts area is rendered (the projection chart)
    await expect(page.locator('.recharts-area-curve')).toBeVisible();
  });

  test('changing the investment amount to 5000 updates the input', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    await investments.setCalculatorAmount(5000);
    await expect(investments.calculatorAmountInput).toHaveValue('5000');
  });

  test('the disclaimer banner is visible below the chart', async ({ page }) => {
    await expect(page.getByText(/past performance does not guarantee/i)).toBeVisible();
  });
});

test.describe('Investments — Portfolio Builder tab', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const investments = factory.investments();
    await investments.navigate();
    await investments.goToSubTab('Portfolio Builder');
  });

  test('Portfolio Builder heading is visible', async ({ page }) => {
    await expect(page.getByText('Allocate Funds')).toBeVisible();
  });

  test('6 portfolio allocation sliders are rendered', async ({ page }) => {
    // Each fund has a range slider; Recharts chart may also use an input[type=range]
    // via the calculator — but we are on the Portfolio Builder sub-tab here
    const investments = new PageFactory(page).investments();
    const sliders = investments.portfolioSliders;
    // 6 fund sliders
    await expect(sliders).toHaveCount(6);
  });

  test('total starts at 0% before any allocation', async ({ page }) => {
    // The label reads "Total: 0% (must be 100%)"
    await expect(page.getByText(/Total: 0%/)).toBeVisible();
  });

  test('allocating 100% to one fund marks the total as valid (emerald text)', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Set the first slider to 100 (US Large Cap Index)
    await investments.setPortfolioSlider(0, 100);

    await expect(page.getByText(/Total: 100%/)).toBeVisible();
    // The label should now be emerald (valid) — not red
    const totalLabel = page.locator('div.mt-4.text-sm.font-semibold');
    await expect(totalLabel).toHaveClass(/text-emerald-400/);
  });

  test('Blended Annual Return label is visible', async ({ page }) => {
    await expect(page.getByText('Blended Annual Return:')).toBeVisible();
  });

  test('portfolio pie chart appears after allocating to at least one fund', async ({ page }) => {
    const investments = new PageFactory(page).investments();

    // Allocate 50% to US Large Cap Index
    await investments.setPortfolioSlider(0, 50);

    // The PieChart should now be rendered
    await expect(page.locator('.recharts-pie')).toBeVisible();
  });
});
