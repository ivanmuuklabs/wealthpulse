import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

const CATEGORIES = [
  'Housing',
  'Food',
  'Transport',
  'Entertainment',
  'Health',
  'Utilities',
  'Shopping',
  'Subscriptions',
];

// ════════════════════════════════════════════════════════════════════════════
// SMOKE TESTS
// Purpose : Verify the Budgets page is reachable, renders its core shell,
//           and exposes the minimum UI needed for users to act.
//           These must pass before any Black Box tests are meaningful.
//           Run time: fast — no interactions beyond navigation.
// ════════════════════════════════════════════════════════════════════════════
test.describe('[Smoke] Budgets', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();
  });

  test('Budgets page is reachable and the heading is visible', async ({ page }) => {
    // Sidebar "Budgets" button becomes active (emerald highlight) after click
    await expect(
      page.getByRole('button', { name: /budgets/i })
    ).toHaveClass(/text-emerald-400/);

    // Main page heading is rendered
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();

    // Top bar title confirms the active section
    await expect(page.locator('header h1')).toHaveText('budgets');
  });

  test('summary cards (Total Budget, Total Spent, Remaining) are present', async ({ page }) => {
    await expect(page.getByText('Total Budget')).toBeVisible();
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Remaining')).toBeVisible();
  });

  test('all 8 budget category cards are rendered', async ({ page }) => {
    for (const category of CATEGORIES) {
      await expect(page.getByText(category).first()).toBeVisible();
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BLACK BOX TESTS
// Purpose : Validate functional behavior from the user's perspective —
//           data accuracy, visual state logic, and write interactions —
//           without knowledge of internal implementation details.
// ════════════════════════════════════════════════════════════════════════════
test.describe('[Black Box] Budgets', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();
  });

  test('summary cards display dollar-formatted values', async ({ page }) => {
    // Each stat card should show a currency value like "$4,350.00"
    const dollarValues = page.locator('text=/\\$[\\d,]+\\.\\d{2}/');
    await expect(dollarValues.first()).toBeVisible();
  });

  test('each category card has a visible progress bar', async ({ page }) => {
    // One progress track per category (8 total), each with a colored fill inside
    const progressTracks = page.locator('.rounded-full.bg-white\\/\\[0\\.06\\]');
    await expect(progressTracks).toHaveCount(8);

    for (let i = 0; i < 8; i++) {
      await expect(progressTracks.nth(i).locator('> div')).toBeVisible();
    }
  });

  test('user can edit a category budget amount and the card reflects the change', async ({ page }) => {
    // Housing is always the first budget input on the page
    const housingInput = page.locator('input[type="number"]').first();

    await expect(housingInput).toBeVisible();
    await expect(housingInput).toBeEnabled();

    const currentValue = await housingInput.inputValue();
    const newValue = String(Number(currentValue) + 500);

    // Clear and fill with the new amount, then commit
    await housingInput.click({ clickCount: 3 });
    await housingInput.fill(newValue);
    await housingInput.press('Tab');

    // Input must persist the new value
    await expect(housingInput).toHaveValue(newValue);

    // Percentage label on the card must still show a valid "X%" string
    const percentageLabel = page
      .locator('.grid.grid-cols-1.sm\\:grid-cols-2 > div')
      .first()
      .locator('span.text-lg.font-bold');

    await expect(percentageLabel).toHaveText(/%/);
  });
});
