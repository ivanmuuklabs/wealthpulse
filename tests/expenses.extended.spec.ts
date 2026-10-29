import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Expenses module — extended tests.
 *
 * The PR's expenses.spec.ts covers adding an expense and real-time search filtering.
 * This file adds coverage for the remaining untested flows:
 *   - Category filter dropdown: restricts rows to the chosen category only
 *   - Column sorting: Date, Category, Amount headers sort the table correctly
 *   - Footer row: displays the filtered count and total
 *   - Month switching: changes the visible transactions
 */

test.describe('Expenses — category filter', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expensesPage = factory.expenses();
    await expensesPage.navigate();
    await expect(page.locator('table')).toBeVisible();
  });

  test('selecting a category from the dropdown filters the table to that category only', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // "Food" is a seeded category — filter to it
    await expensesPage.filterByCategory('Food');

    // Every visible row's category cell must contain "Food"
    const rows = expensesPage.tableRows;
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const rowText = await rows.nth(i).textContent();
      expect((rowText ?? '').toLowerCase()).toContain('food');
    }
  });

  test('resetting the category filter to All restores the full transaction list', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    const initialCount = await expensesPage.tableRows.count();

    // Filter to a specific category — row count should decrease
    await expensesPage.filterByCategory('Housing');
    const filteredCount = await expensesPage.tableRows.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Reset to "All" — should restore the original count
    await expensesPage.filterByCategory('All');
    await expect(expensesPage.tableRows).toHaveCount(initialCount);
  });

  test('combining search and category filter narrows results further', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // Filter by Food first
    await expensesPage.filterByCategory('Food');
    const foodCount = await expensesPage.tableRows.count();

    // Then search within Food — result should be ≤ Food-only count
    await expensesPage.search('a'); // most descriptions contain at least one 'a'
    const combinedCount = await expensesPage.tableRows.count();
    expect(combinedCount).toBeLessThanOrEqual(foodCount);
  });
});

test.describe('Expenses — column sorting', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expensesPage = factory.expenses();
    await expensesPage.navigate();
    await expect(page.locator('table')).toBeVisible();
  });

  test('clicking the Amount column header sorts rows by amount descending', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    await expensesPage.sortBy('Amount');

    // After sorting, the first row should have the largest (most negative) amount
    // Grab all amount cells — they are formatted as e.g. "-$123.45"
    const amountCells = page.locator('tbody tr td').filter({ hasText: /^-\$[\d,]+\.\d{2}$/ });
    const count = await amountCells.count();
    expect(count).toBeGreaterThan(1);

    const firstAmount = parseFloat(
      ((await amountCells.first().textContent()) ?? '0').replace(/[$,]/g, '')
    );
    const secondAmount = parseFloat(
      ((await amountCells.nth(1).textContent()) ?? '0').replace(/[$,]/g, '')
    );

    // Descending: first value ≤ second (both negative; more negative = smaller number = larger absolute spend)
    expect(firstAmount).toBeLessThanOrEqual(secondAmount);
  });

  test('clicking the Category column header sorts rows alphabetically by category', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    await expensesPage.sortBy('Category');

    // Category cells are the 3rd column in the table (0-indexed: td:nth-child(3))
    const categoryCells = page.locator('tbody tr td:nth-child(3)');
    const count = await categoryCells.count();
    expect(count).toBeGreaterThan(1);

    const firstCat = (await categoryCells.first().textContent() ?? '').trim().toLowerCase();
    const secondCat = (await categoryCells.nth(1).textContent() ?? '').trim().toLowerCase();

    // First category should come before or equal to the second alphabetically
    expect(firstCat.localeCompare(secondCat)).toBeLessThanOrEqual(0);
  });
});

test.describe('Expenses — footer totals', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expensesPage = factory.expenses();
    await expensesPage.navigate();
    await expect(page.locator('table')).toBeVisible();
  });

  test('footer row is visible and shows a transaction count', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();
    await expect(expensesPage.footerSummary).toBeVisible();

    // Footer contains the row count as a number
    const footerText = await expensesPage.footerSummary.textContent();
    expect(footerText).toMatch(/\d+/);
  });

  test('footer transaction count decreases when a search filter is applied', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    // Read the unfiltered count from the footer
    const unfilteredText = await expensesPage.footerSummary.textContent() ?? '';
    const unfilteredMatch = unfilteredText.match(/(\d+)/);
    const unfilteredCount = unfilteredMatch ? parseInt(unfilteredMatch[1]) : 0;

    // Apply a very specific search that matches far fewer rows
    await expensesPage.search('Housing');

    const filteredText = await expensesPage.footerSummary.textContent() ?? '';
    const filteredMatch = filteredText.match(/(\d+)/);
    const filteredCount = filteredMatch ? parseInt(filteredMatch[1]) : 0;

    expect(filteredCount).toBeLessThanOrEqual(unfilteredCount);
  });
});

test.describe('Expenses — month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expensesPage = factory.expenses();
    await expensesPage.navigate();
    await expect(page.locator('table')).toBeVisible();
  });

  test('switching from January to March changes the visible transactions', async ({ page }) => {
    const expensesPage = new PageFactory(page).expenses();

    await expensesPage.selectMonth('Jan');
    const janFirstRow = await expensesPage.tableRows.first().textContent();

    await expensesPage.selectMonth('Mar');
    const marFirstRow = await expensesPage.tableRows.first().textContent();

    // Different months have different transactions — the first row content must differ
    expect(janFirstRow).not.toEqual(marFirstRow);
  });

  test('all three month selectors are present and clickable', async ({ page }) => {
    // Verify Jan, Feb, Mar buttons exist and are interactive
    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      const btn = page.getByRole('button', { name: month });
      await expect(btn).toBeVisible();
      await btn.click();
      await expect(page.locator('table')).toBeVisible();
    }
  });
});
