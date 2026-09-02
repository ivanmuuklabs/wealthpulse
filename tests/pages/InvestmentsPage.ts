import { Page, Locator } from '@playwright/test';

export class InvestmentsPage {
  readonly fundCards: Locator;
  readonly selectedBadges: Locator;
  readonly searchInput: Locator;
  readonly compareEmptyState: Locator;
  readonly comparisonChart: Locator;
  readonly calculatorAmountInput: Locator;
  readonly calculatorYAxisTicks: Locator;
  /** The time-horizon range slider on the Calculator sub-tab. */
  readonly calculatorTimeHorizonSlider: Locator;
  /** The area chart rendered by the Calculator sub-tab. */
  readonly calculatorAreaChart: Locator;
  readonly portfolioSliders: Locator;
  readonly portfolioTotalLabel: Locator;
  /** The donut (pie) chart on the Portfolio Builder sub-tab. */
  readonly portfolioDonutChart: Locator;

  constructor(private page: Page) {
    this.fundCards = page.locator('.grid > div').filter({ hasText: /Expense Ratio/ });
    this.selectedBadges = page.locator('text=✓ Selected');
    this.searchInput = page.getByPlaceholder('Search funds…');
    this.compareEmptyState = page.getByText('Select funds from the Fund Cards tab to compare');
    this.comparisonChart = page.locator('.recharts-line-chart');
    this.calculatorAmountInput = page.getByLabel('Investment ($)');
    this.calculatorYAxisTicks = page.locator('.recharts-yAxis .recharts-cartesian-axis-tick-value');
    this.calculatorTimeHorizonSlider = page.getByLabel('Time Horizon (years)');
    this.calculatorAreaChart = page.locator('.recharts-area-chart');
    this.portfolioSliders = page.locator('input[type="range"]');
    this.portfolioTotalLabel = page.locator('text=/Total:/');
    this.portfolioDonutChart = page.locator('.recharts-pie-chart');
  }

  async navigate() {
    await this.page.getByRole('button', { name: /investments/i }).click();
  }

  async goToSubTab(name: 'Fund Cards' | 'Compare' | 'Calculator' | 'Portfolio Builder') {
    await this.page.getByRole('button', { name }).click();
  }

  async searchFunds(term: string) {
    await this.searchInput.fill(term);
  }

  async selectFundCard(index: number) {
    await this.fundCards.nth(index).click();
  }

  async setCalculatorAmount(amount: number) {
    await this.calculatorAmountInput.clear();
    await this.calculatorAmountInput.fill(String(amount));
  }

  async setPortfolioSlider(index: number, value: number) {
    await this.portfolioSliders.nth(index).fill(String(value));
    await this.portfolioSliders.nth(index).dispatchEvent('input');
  }
}
