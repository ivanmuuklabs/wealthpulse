import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Charts (formerly Dashboard) section.
 * Covers the Overview KPI cards, month selector, and budget alerts.
 */
export class ChartsPage {
  readonly heading: Locator;
  readonly chartsNavButton: Locator;
  readonly monthlyIncomeCard: Locator;
  readonly totalSpentCard: Locator;
  readonly netSavingsCard: Locator;
  readonly transactionsCard: Locator;
  readonly janButton: Locator;
  readonly febButton: Locator;
  readonly marButton: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Overview' });
    this.chartsNavButton = page.getByRole('button', { name: 'Charts' });

    // KPI stat cards — located by their visible label text
    this.monthlyIncomeCard = page.getByText('Monthly Income');
    this.totalSpentCard = page.getByText('Total Spent').first();
    this.netSavingsCard = page.getByText('Net Savings');
    this.transactionsCard = page.getByText('Transactions');

    // Month selector buttons
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });
  }

  async navigate() {
    await this.chartsNavButton.click();
  }

  async selectMonth(month: 'Jan' | 'Feb' | 'Mar') {
    const buttons: Record<string, Locator> = {
      Jan: this.janButton,
      Feb: this.febButton,
      Mar: this.marButton,
    };
    await buttons[month].click();
  }
}
