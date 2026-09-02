import { Page, Locator } from '@playwright/test';

/**
 * Page object for the Waste tab (formerly "Expenses").
 * Encapsulates all locators and interaction helpers for the renamed section.
 */
export class WastePage {
  /** The sidebar nav button that navigates to the Waste section */
  readonly sidebarButton: Locator;
  /** The main page heading inside the Waste tab */
  readonly heading: Locator;
  /** Month-selector buttons row */
  readonly monthButtons: Locator;
  /** The transaction table body rows */
  readonly tableRows: Locator;
  /** Empty-state cell shown when no transactions match */
  readonly emptyState: Locator;
  /** "Add Expense" button that opens the add-expense form */
  readonly addExpenseButton: Locator;

  constructor(private page: Page) {
    this.sidebarButton = page.getByRole('button', { name: 'Waste' });
    this.heading = page.getByRole('heading', { name: 'Waste', level: 2 });
    // Month buttons sit inside a flex container; they render as plain <button> elements
    // with a short month label (Jan, Feb, Mar, Apr)
    this.monthButtons = page
      .locator('div.flex.bg-white\\/\\[0\\.04\\]')
      .filter({ has: page.getByRole('button', { name: 'Jan' }) })
      .getByRole('button');
    this.tableRows = page.locator('table tbody tr');
    this.emptyState = page.getByText('No transactions found');
    this.addExpenseButton = page.getByRole('button', { name: 'Add Expense' });
  }

  /** Navigate to the Waste tab via the sidebar button */
  async navigate() {
    await this.sidebarButton.click();
    await this.page.waitForSelector('h2', { state: 'visible' });
  }

  /** Click a month button by its visible label (e.g. 'Apr') */
  async selectMonth(label: 'Jan' | 'Feb' | 'Mar' | 'Apr') {
    await this.page.getByRole('button', { name: label, exact: true }).click();
  }
}
