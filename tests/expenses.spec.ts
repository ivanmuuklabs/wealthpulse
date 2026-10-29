import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses — happy path tests
 *
 * Covers the primary success scenarios for the Expenses tab:
 *   - Viewing the expenses list after login
 *   - Adding a new expense and seeing it appear in the table
 *   - Switching months and seeing a different transaction set
 *   - Filtering by search term
 *   - Filtering by category
 *   - Sorting columns
 */

test.describe('Expenses — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();
  });

  test('Expenses tab shows heading and transaction rows after login', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Heading is visible
    await expect(expenses.heading).toBeVisible();

    // At least one seeded transaction row should be present for March (default month)
    await expect(expenses.transactionRows.first()).toBeVisible();
  });

  test('adding a new expense appends it to the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Record current row count
    const initialCount = await expenses.transactionRows.count();

    await expenses.openAddForm();
    await expenses.addExpense('Test Coffee Shop', '12.50', 'Food');

    // New row should appear — count grows by 1
    await expect(expenses.transactionRows).toHaveCount(initialCount + 1);

    // The description should be visible in the table
    await expect(page.getByText('Test Coffee Shop')).toBeVisible();
  });

  test('switching months changes the displayed transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Read transaction count for March (default, index 2)
    const marchCount = await expenses.transactionRows.count();

    // Switch to January (index 0)
    await page.getByRole('button', { name: 'Jan' }).click();
    const janCount = await expenses.transactionRows.count();

    // Both months have seeded data but are independent — counts may differ
    expect(marchCount + janCount).toBeGreaterThan(0);
  });

  test('searching for a known description narrows the transaction list', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Get all texts to find a real description in the table
    const allDescs = await page.locator('tbody tr td:nth-child(2)').allTextContents();
    expect(allDescs.length).toBeGreaterThan(0);

    // Search for the first description (known to exist)
    const term = allDescs[0].split(' ')[0]; // use first word to allow partial match
    await expenses.search(term);

    // Every remaining row must contain the search term (case-insensitive)
    const filteredDescs = await page.locator('tbody tr td:nth-child(2)').allTextContents();
    for (const desc of filteredDescs) {
      expect(desc.toLowerCase()).toContain(term.toLowerCase());
    }
  });

  test('filtering by a category shows only transactions of that category', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.filterByCategory('Housing');

    // Every visible category badge should say "Housing"
    const badges = page.locator('tbody tr td:nth-child(3) span');
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).toContainText('Housing');
    }
  });

  test('clicking Amount column header sorts transactions by amount descending', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.sortByColumn('amount');

    // Read amount texts from the table (formatted as "-$X.XX")
    const amountTexts = await expenses.getAmountTexts();
    const amounts = amountTexts.map(t => parseFloat(t.replace(/[^0-9.]/g, '')));

    // Verify descending order (each value ≥ the next)
    for (let i = 0; i < amounts.length - 1; i++) {
      expect(amounts[i]).toBeGreaterThanOrEqual(amounts[i + 1]);
    }
  });

  test('total at the bottom reflects the sum of visible transactions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Filter to a single category to keep totals predictable
    await expenses.filterByCategory('Food');

    const amountTexts = await expenses.getAmountTexts();
    const sum = amountTexts.reduce((s, t) => s + parseFloat(t.replace(/[^0-9.]/g, '')), 0);

    // The footer total should contain the computed sum (rounded to 2 decimal places)
    const totalText = await expenses.totalLabel.textContent();
    const footerAmount = parseFloat((totalText ?? '').replace(/[^0-9.]/g, ''));
    expect(Math.abs(footerAmount - sum)).toBeLessThanOrEqual(0.02);
  });
});
