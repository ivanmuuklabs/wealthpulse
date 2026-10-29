import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Sidebar navigation — all 5 application sections
 *
 * The existing sidebar.navigation.spec.ts covers the Charts (Dashboard)
 * label/active-state in isolation. These tests verify that every sidebar
 * button navigates to the correct section and that both the page heading
 * and the top-bar title reflect the active tab.
 *
 * Covered tabs: Charts (Dashboard), Expenses, Investments, Budgets, Settings.
 */

test.describe('Sidebar navigation — all sections', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Verify we land on Dashboard (Charts) after login
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('clicking "Expenses" nav item shows the Expenses heading and updates the top-bar title', async ({ page }) => {
    await page.getByRole('button', { name: /expenses/i }).click();

    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
    await expect(page.locator('header h1')).toHaveText('expenses');
  });

  test('clicking "Investments" nav item shows the Investments heading and updates the top-bar title', async ({ page }) => {
    await page.getByRole('button', { name: /investments/i }).click();

    await expect(page.getByRole('heading', { name: 'Investments' })).toBeVisible();
    await expect(page.locator('header h1')).toHaveText('investments');
  });

  test('clicking "Budgets" nav item shows the Budgets heading and updates the top-bar title', async ({ page }) => {
    await page.getByRole('button', { name: /budgets/i }).click();

    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
    await expect(page.locator('header h1')).toHaveText('budgets');
  });

  test('clicking "Settings" nav item shows the Settings heading and updates the top-bar title', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.locator('header h1')).toHaveText('settings');
  });

  test('clicking "Charts" nav item from Expenses returns to the Overview heading', async ({ page }) => {
    // Navigate away first
    await page.getByRole('button', { name: /expenses/i }).click();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();

    // Navigate back
    await page.getByRole('button', { name: /charts/i }).click();

    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await expect(page.locator('header h1')).toHaveText('dashboard');
  });

  test('all 5 sidebar buttons are visible and accessible after login', async ({ page }) => {
    await expect(page.getByRole('button', { name: /charts/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /expenses/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /investments/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /budgets/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /settings/i })).toBeVisible();
  });

  test('cycling through every section in order leaves the app stable', async ({ page }) => {
    // Visit every section in sequence and assert the main heading each time
    const sections: Array<{ button: RegExp; heading: string }> = [
      { button: /expenses/i,    heading: 'Expenses' },
      { button: /investments/i, heading: 'Investments' },
      { button: /budgets/i,     heading: 'Budgets' },
      { button: /settings/i,    heading: 'Settings' },
      { button: /charts/i,      heading: 'Overview' },
    ];

    for (const { button, heading } of sections) {
      await page.getByRole('button', { name: button }).click();
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }
  });
});
