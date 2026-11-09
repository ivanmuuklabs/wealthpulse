import { Page, Locator } from '@playwright/test';

export class BudgetsPage {
  /** The Transport category card (contains the "Transport" title and the budget spinbutton). */
  readonly transportCard: Locator;
  readonly transportPercent: Locator;
  readonly transportRemaining: Locator;
  readonly transportBar: Locator;
  readonly transportBudgetInput: Locator;

  constructor(private page: Page) {
    this.transportCard = page
      .locator('div.rounded-2xl')
      .filter({ has: page.getByText('Transport', { exact: true }) })
      .filter({ has: page.getByRole('spinbutton') });
    this.transportPercent = this.transportCard.getByText(/^\d+%$/);
    this.transportRemaining = this.transportCard.getByText(/ (left|over)$/);
    this.transportBar = this.transportCard.locator('div.h-full.rounded-full');
    this.transportBudgetInput = this.transportCard.getByRole('spinbutton');
  }

  async navigate() {
    await this.page.getByRole('button', { name: 'Budgets', exact: true }).click();
  }

  async setTransportBudget(value: string) {
    await this.transportBudgetInput.fill(value);
  }

  /** Reads a top KPI card ("Total Budget" | "Total Spent" | "Remaining") as a number. */
  async kpi(label: 'Total Budget' | 'Total Spent' | 'Remaining'): Promise<number> {
    const text = await this.page
      .getByText(label, { exact: true })
      .locator('xpath=following-sibling::p[1]')
      .textContent();
    return parseFloat((text ?? '0').replace(/[^0-9.-]/g, ''));
  }
}
