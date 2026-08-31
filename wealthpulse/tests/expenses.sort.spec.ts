import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await factory.expenses().navigate();
});

// ─── Expenses — sort table by Amount column ────────────────────────────────────

// Clicking the Amount column header once sorts the table descending (largest
// first); clicking again sorts ascending (smallest first).
test('clicking the Amount column header sorts expenses descending then ascending', async ({ page }) => {
  // The expenses table must be visible
  const tableBody = page.locator('tbody');
  await expect(tableBody).toBeVisible();

  // Locate the Amount column header
  const amountHeader = page
    .locator('th')
    .filter({ hasText: /amount/i })
    .first();
  await expect(amountHeader).toBeVisible();

  // ── First click: descending sort ─────────────────────────────────────────
  await amountHeader.click();

  // Grab all amount cells after the click and parse them as numbers
  const amountCells = page.locator('tbody tr td').filter({ hasText: /\$[\d,.]+/ });
  const firstClickValues = await amountCells.allTextContents();

  // Convert "$1,234.56" → 1234.56
  const parseAmount = (text: string) =>
    parseFloat(text.replace(/[^0-9.]/g, ''));

  const firstClickNums = firstClickValues.map(parseAmount).filter(n => !isNaN(n));

  // Verify descending order: each value >= the next
  for (let i = 0; i < firstClickNums.length - 1; i++) {
    expect(firstClickNums[i]).toBeGreaterThanOrEqual(firstClickNums[i + 1]);
  }

  // ── Second click: ascending sort ─────────────────────────────────────────
  await amountHeader.click();

  const secondClickValues = await amountCells.allTextContents();
  const secondClickNums = secondClickValues.map(parseAmount).filter(n => !isNaN(n));

  // Verify ascending order: each value <= the next
  for (let i = 0; i < secondClickNums.length - 1; i++) {
    expect(secondClickNums[i]).toBeLessThanOrEqual(secondClickNums[i + 1]);
  }

  // The second-click order should differ from the first-click order
  expect(secondClickValues).not.toEqual(firstClickValues);
});

// ─── Expenses — sort by Date column ───────────────────────────────────────────

// Clicking the Date header should also toggle sort order.
test('clicking the Date column header toggles sort order', async ({ page }) => {
  const tableBody = page.locator('tbody');
  await expect(tableBody).toBeVisible();

  const dateHeader = page
    .locator('th')
    .filter({ hasText: /date/i })
    .first();
  await expect(dateHeader).toBeVisible();

  // Capture initial row order by reading first cells
  const dateCells = page.locator('tbody tr td:first-child');
  const before = await dateCells.allTextContents();

  await dateHeader.click();
  const after = await dateCells.allTextContents();

  // Order must have changed (or at minimum the header click didn't crash)
  // If the seeded data has only one row the test passes trivially — that's fine
  if (before.length > 1) {
    expect(after).not.toEqual(before);
  }
});

// ─── Expenses — sort by Category column ───────────────────────────────────────

// Clicking the Category header sorts rows alphabetically; a second click
// reverses to Z→A order.
test('clicking the Category column header sorts expenses alphabetically', async ({ page }) => {
  const tableBody = page.locator('tbody');
  await expect(tableBody).toBeVisible();

  const categoryHeader = page
    .locator('th')
    .filter({ hasText: /category/i })
    .first();
  await expect(categoryHeader).toBeVisible();

  // ── First click: descending (Z → A) ──────────────────────────────────────
  await categoryHeader.click();

  // Read the category badge text from each row (3rd column, index 2)
  const catCells = page.locator('tbody tr td:nth-child(3)');
  const descValues = await catCells.allTextContents();

  // Expect at least one row
  expect(descValues.length).toBeGreaterThan(0);

  // Verify Z→A: each category text should be >= the next
  for (let i = 0; i < descValues.length - 1; i++) {
    expect(descValues[i].trim().localeCompare(descValues[i + 1].trim())).toBeGreaterThanOrEqual(0);
  }

  // ── Second click: ascending (A → Z) ──────────────────────────────────────
  await categoryHeader.click();

  const ascValues = await catCells.allTextContents();

  // Verify A→Z: each category text should be <= the next
  for (let i = 0; i < ascValues.length - 1; i++) {
    expect(ascValues[i].trim().localeCompare(ascValues[i + 1].trim())).toBeLessThanOrEqual(0);
  }

  // The two sort orders should differ (assuming >1 distinct category)
  if (descValues.length > 1) {
    expect(ascValues).not.toEqual(descValues);
  }
});
