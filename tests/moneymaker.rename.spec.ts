import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Regression tests for the Investments → MoneyMaker rename (PR #56).
 *
 * The sidebar label and the tab heading were both changed from "Investments"
 * to "MoneyMaker". These tests pin the new labels so any accidental revert or
 * further rename is caught immediately — following the same pattern established
 * by sidebar.navigation.spec.ts for the earlier "Dashboard → Charts" rename.
 */

test.describe('MoneyMaker rename — sidebar label and tab heading', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we are inside the app before each test
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('sidebar nav item is labelled "MoneyMaker", not "Investments"', async ({ page }) => {
    // The renamed button must be present
    const moneyMakerButton = page.getByRole('button', { name: 'MoneyMaker' });
    await expect(moneyMakerButton).toBeVisible();

    // The old label must no longer exist in the sidebar
    await expect(page.getByRole('button', { name: 'Investments' })).toHaveCount(0);
  });

  test('clicking "MoneyMaker" in the sidebar navigates to the section', async ({ page }) => {
    const factory = new PageFactory(page);
    // Use the updated page-object navigate() which targets /moneymaker/i
    await factory.investments().navigate();

    // The section heading should read "MoneyMaker"
    await expect(page.getByRole('heading', { name: 'MoneyMaker' })).toBeVisible();
  });

  test('MoneyMaker tab heading reads "MoneyMaker", not "Investments"', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.investments().navigate();

    // The h2 inside the tab must show the new name
    await expect(page.getByRole('heading', { name: 'MoneyMaker' })).toBeVisible();

    // The old heading must not appear anywhere on the page
    await expect(page.getByRole('heading', { name: 'Investments' })).toHaveCount(0);
  });

  test('MoneyMaker sidebar button becomes active after navigation', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.investments().navigate();

    const moneyMakerButton = page.getByRole('button', { name: 'MoneyMaker' });
    // Active sidebar items carry the emerald text class — same convention as Charts button
    await expect(moneyMakerButton).toHaveClass(/text-emerald-400/);
  });

  test('navigating away and back to MoneyMaker restores active state', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.investments().navigate();

    // Go to Expenses to deactivate MoneyMaker
    await page.getByRole('button', { name: 'Expenses' }).click();

    const moneyMakerButton = page.getByRole('button', { name: 'MoneyMaker' });
    await expect(moneyMakerButton).not.toHaveClass(/text-emerald-400/);

    // Navigate back — active class and heading should both be restored
    await moneyMakerButton.click();
    await expect(moneyMakerButton).toHaveClass(/text-emerald-400/);
    await expect(page.getByRole('heading', { name: 'MoneyMaker' })).toBeVisible();
  });
});
