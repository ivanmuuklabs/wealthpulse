import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Regression tests for the sidebar navigation label.
 *
 * PR #10 reverted the sidebar's first nav item from "Reports" back to "Dashboard".
 * These tests pin the correct label so a future rename is caught immediately.
 */

test.describe('Sidebar navigation — Dashboard label', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Wait until we are inside the app
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('sidebar first nav item is labelled "Dashboard", not "Reports"', async ({ page }) => {
    // The button that navigates to the dashboard section must show "Dashboard"
    const dashboardButton = page.getByRole('button', { name: 'Dashboard' });
    await expect(dashboardButton).toBeVisible();

    // Guard: no button labelled "Reports" should exist in the sidebar
    await expect(page.getByRole('button', { name: 'Reports' })).toHaveCount(0);
  });

  test('Dashboard nav item is active (highlighted) immediately after login', async ({ page }) => {
    // Active sidebar items carry the emerald text class
    const dashboardButton = page.getByRole('button', { name: 'Dashboard' });
    await expect(dashboardButton).toHaveClass(/text-emerald-400/);
  });

  test('clicking Dashboard nav item keeps the Overview heading visible', async ({ page }) => {
    // Click the Dashboard button (even if already active) and confirm the view stays
    await page.getByRole('button', { name: 'Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('navigating away and back to Dashboard restores the active state', async ({ page }) => {
    // Go to Expenses
    await page.getByRole('button', { name: 'Expenses' }).click();
    const dashboardButton = page.getByRole('button', { name: 'Dashboard' });

    // Dashboard button should no longer be the active item
    await expect(dashboardButton).not.toHaveClass(/text-emerald-400/);

    // Navigate back to Dashboard
    await dashboardButton.click();
    await expect(dashboardButton).toHaveClass(/text-emerald-400/);
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });
});
