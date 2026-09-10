import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * App state reset on sign-out
 *
 * WealthPulse is a fully in-memory SPA — all data resets when the user
 * signs out. These tests verify that mutations made to Settings and Expenses
 * during a session are NOT present in a subsequent session after sign-out
 * and re-login.
 *
 * The auth.extended.spec.ts covers that sign-out returns the user to the
 * login screen. These tests go further and confirm that the in-memory state
 * (name changes, added expenses, budget edits) is actually discarded.
 *
 * This flow is not covered by any existing test on main or in this PR's
 * added spec files.
 */

test.describe('App state reset — sign-out discards in-memory mutations', () => {
  test('Settings name change does not persist after sign-out and re-login', async ({ page }) => {
    const factory = new PageFactory(page);

    // --- Session 1: change the Full Name ---
    await factory.login().goto();
    await factory.login().loginAsDemo();

    await factory.settings().navigate();
    await factory.settings().updateName('Temporary Name Change');
    await expect(factory.settings().savedConfirmation).toBeVisible();

    // Confirm the name updated in session 1
    await expect(factory.settings().nameInput).toHaveValue('Temporary Name Change');

    // Sign out
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // --- Session 2: re-login and verify name has reset ---
    await factory.login().loginAsDemo();
    await factory.settings().navigate();

    // Name must be back to the seeded default
    await expect(factory.settings().nameInput).toHaveValue('Alex Morgan');
  });

  test('Expenses added during a session are not present after sign-out and re-login', async ({ page }) => {
    const factory = new PageFactory(page);

    // --- Session 1: add a uniquely-named expense ---
    await factory.login().goto();
    await factory.login().loginAsDemo();

    await factory.expenses().navigate();
    await factory.expenses().addExpense('PersistenceTestExpense', 777.77);
    await expect(page.getByText('PersistenceTestExpense')).toBeVisible();

    // Sign out
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // --- Session 2: re-login and verify the expense is gone ---
    await factory.login().loginAsDemo();
    await factory.expenses().navigate();

    await expect(page.getByText('PersistenceTestExpense')).not.toBeVisible();
  });

  test('Budget edits made during a session reset to seeded defaults after sign-out', async ({ page }) => {
    const factory = new PageFactory(page);

    // --- Session 1: set Housing budget to an unusual value ---
    await factory.login().goto();
    await factory.login().loginAsDemo();

    await factory.budgets().navigate();
    const budgets = factory.budgets();

    // Record the seeded Housing budget value
    const originalBudgetText = await budgets.getKpiValue('Total Budget');
    const originalBudget = parseFloat(originalBudgetText.replace(/[$,]/g, ''));

    // Mutate Housing to a very different value
    await budgets.setBudgetLimit('Housing', 9999);

    const mutatedBudgetText = await budgets.getKpiValue('Total Budget');
    const mutatedBudget = parseFloat(mutatedBudgetText.replace(/[$,]/g, ''));
    expect(mutatedBudget).toBeGreaterThan(originalBudget);

    // Sign out
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // --- Session 2: re-login and confirm budget has reset ---
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();

    const resetBudgetText = await budgets.getKpiValue('Total Budget');
    const resetBudget = parseFloat(resetBudgetText.replace(/[$,]/g, ''));

    // Should be back to the seeded default (well below the mutated 9999 value)
    expect(resetBudget).toBeLessThan(mutatedBudget);
  });

  test('currency setting reverts to USD after sign-out and re-login', async ({ page }) => {
    const factory = new PageFactory(page);

    // --- Session 1: change currency to EUR ---
    await factory.login().goto();
    await factory.login().loginAsDemo();

    await factory.settings().navigate();
    await factory.settings().updateCurrency('EUR');
    await expect(factory.settings().currencySelect).toHaveValue('EUR');

    // Sign out
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // --- Session 2: re-login and verify currency is back to USD ---
    await factory.login().loginAsDemo();
    await factory.settings().navigate();

    await expect(factory.settings().currencySelect).toHaveValue('USD');
  });
});
