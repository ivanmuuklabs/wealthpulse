import { Page, Locator } from '@playwright/test';

export class InvestmentsPage {
  readonly fundCards: Locator;
  readonly selectedBadges: Locator;
  readonly searchInput: Locator;
  readonly compareEmptyState: Locator;
  readonly comparisonChart: Locator;
  readonly calculatorAmountInput: Locator;
  readonly calculatorYAxisTicks: Locator;
  readonly portfolioSliders: Locator;
  readonly portfolioTotalLabel: Locator;

  // Fund Cards tab — risk badges and sparklines
  readonly riskBadges: Locator;
  readonly sparklines: Locator;
  readonly expenseRatios: Locator;

  constructor(private page: Page) {
    this.fundCards = page.locator('.grid > div').filter({ hasText: /Expense Ratio/ });
    this.selectedBadges = page.locator('text=✓ Selected');
    this.searchInput = page.getByPlaceholder('Search funds…');
    this.compareEmptyState = page.getByText('Select funds from the Fund Cards tab to compare');
    this.comparisonChart = page.locator('.recharts-line-chart');
    this.calculatorAmountInput = page.getByLabel('Investment ($)');
    this.calculatorYAxisTicks = page.locator('.recharts-yAxis .recharts-cartesian-axis-tick-value');
    this.portfolioSliders = page.locator('input[type="range"]');
    this.portfolioTotalLabel = page.locator('text=/Total:/');

    // Extended locators for Fund Cards positive coverage
    this.riskBadges = page.locator('.grid > div').filter({ hasText: /Expense Ratio/ }).locator('text=/Low|Medium|High/');
    this.sparklines = page.locator('.recharts-line');
    this.expenseRatios = page.locator('text=/Expense Ratio/');
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

  async clearSearch() {
    await this.searchInput.clear();
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
