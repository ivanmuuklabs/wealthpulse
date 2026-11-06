import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

// NOTE: seeded transactions are randomised on every page load, so the filter
// test adds its own uniquely named expenses and the sort test asserts ordering
// rather than specific values.

test.beforeEach(async ({ page }) => {
  const loginPage = new PageFactory(page).login();
  await loginPage.goto();
  await loginPage.loginAsDemo();
  await new PageFactory(page).expenses().navigate();
});

const isSorted = <T>(values: T[], cmp: (a: T, b: T) => number, dir: 'asc' | 'desc') =>
  values.every((v, i) => i === 0 || (dir === 'asc' ? cmp(values[i - 1], v) <= 0 : cmp(values[i - 1], v) >= 0));

const numeric = (a: number, b: number) => a - b;
const text = (a: string, b: string) => a.localeCompare(b);

test.describe('Expenses — filter and search', () => {

  test('category filter and search narrow the list and show an empty state', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Known, unique expense so search results are deterministic
    await expenses.addExpense({ description: 'Zebra Quartz Invoice', amount: 42, category: 'Shopping' });
    await expect(expenses.rowByDescription('Zebra Quartz Invoice')).toHaveCount(1);

    // Category filter: every remaining row belongs to Food
    await expenses.filterByCategory('Food');
    await expect(expenses.rows.first()).toBeVisible();
    await expect(
      expenses.rows.filter({ hasNot: page.locator('td:nth-child(3)', { hasText: 'Food' }) })
    ).toHaveCount(0);
    await expect(expenses.rowByDescription('Zebra Quartz Invoice')).toHaveCount(0);

    // Back to all categories, then case-insensitive search by description
    await expenses.filterByCategory('All');
    await expenses.search('zebra quartz');
    await expect(expenses.rows).toHaveCount(1);
    await expect(expenses.countLabel).toHaveText('1 transaction');
    await expect(expenses.rows.first()).toContainText('Zebra Quartz Invoice');

    // Category filter combined with a non-matching search -> empty state
    await expenses.filterByCategory('Food');
    await expect(expenses.emptyState).toBeVisible();
    await expect(expenses.countLabel).toHaveText('0 transactions');

    // Clearing the search restores the Food rows
    await expenses.search('');
    await expect(expenses.emptyState).toBeHidden();
    await expect(expenses.rows.first()).toBeVisible();
  });

});

test.describe('Expenses — sorting', () => {

  test('clicking Date, Amount and Category headers sorts the list in both directions', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Sorting needs more than one row to be meaningful
    expect(await expenses.rows.count()).toBeGreaterThan(1);

    await test.step('Date: newest first by default, then oldest first', async () => {
      await expect.poll(async () => isSorted(await expenses.getDates(), text, 'desc')).toBe(true);
      await expenses.sortBy('Date');
      await expect.poll(async () => isSorted(await expenses.getDates(), text, 'asc')).toBe(true);
    });

    await test.step('Amount: highest first, then lowest first', async () => {
      await expenses.sortBy('Amount');
      await expect.poll(async () => isSorted(await expenses.getAmounts(), numeric, 'desc')).toBe(true);
      await expenses.sortBy('Amount');
      await expect.poll(async () => isSorted(await expenses.getAmounts(), numeric, 'asc')).toBe(true);
    });

    await test.step('Category: Z–A first, then A–Z', async () => {
      await expenses.sortBy('Category');
      await expect.poll(async () => isSorted(await expenses.getCategories(), text, 'desc')).toBe(true);
      await expenses.sortBy('Category');
      await expect.poll(async () => isSorted(await expenses.getCategories(), text, 'asc')).toBe(true);
    });
  });

});
