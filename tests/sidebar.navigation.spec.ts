import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Regression tests for the sidebar navigation label.
 *
 * PR #10 reverted the sidebar's first nav item from "Reports" back to "Dashboard".
 * A later rename changed it from "Dashboard" to "Charts".
 * These tests pin the correct label so a future rename is caught immediately.
 */

test.describe('Sidebar navigation — Charts label', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Wait until we are inside the app
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('sidebar first nav item is labelled "Charts", not "Dashboard" or "Reports"', async ({ page }) => {
    // The button that navigates to the dashboard section must show "Charts"
    const chartsButton = page.getByRole('button', { name: 'Charts' });
    await expect(chartsButton).toBeVisible();

    // Guard: no button labelled "Dashboard" or "Reports" should exist in the sidebar
    await expect(page.getByRole('button', { name: 'Dashboard' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Reports' })).toHaveCount(0);
  });

  test('Charts nav item is active (highlighted) immediately after login', async ({ page }) => {
    // Active sidebar items carry the emerald text class
    const chartsButton = page.getByRole('button', { name: 'Charts' });
    await expect(chartsButton).toHaveClass(/text-emerald-400/);
  });

  test('clicking Charts nav item keeps the Overview heading visible', async ({ page }) => {
    // Click the Charts button (even if already active) and confirm the view stays
    await page.getByRole('button', { name: 'Charts' }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('navigating away and back to Charts restores the active state', async ({ page }) => {
    // Go to Expenses
    await page.getByRole('button', { name: 'Expenses' }).click();
    const chartsButton = page.getByRole('button', { name: 'Charts' });

    // Charts button should no longer be the active item
    await expect(chartsButton).not.toHaveClass(/text-emerald-400/);

    // Navigate back to Charts
    await chartsButton.click();
    await expect(chartsButton).toHaveClass(/text-emerald-400/);
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });
});
