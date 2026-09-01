import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Extended authentication tests covering flows not addressed by auth.spec.ts.
 *
 * These tests directly exercise the LoginPage selectors fixed in this PR
 * (exact placeholder matching), ensuring the fix works correctly for both
 * the happy path variants and the error path.
 */

test.describe('Login — error and edge-case flows', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
  });

  test('wrong username shows invalid-credentials error', async ({ page }) => {
    const loginPage = new PageFactory(page).login();

    // Enter an invalid username with the correct password
    await loginPage.login('wronguser', 'demo123');

    // The app should stay on the login screen and show the error message
    await expect(loginPage.errorMessage).toBeVisible();
    // Confirm we are NOT on the dashboard
    await expect(page.getByRole('heading', { name: 'Overview' })).not.toBeVisible();
  });

  test('wrong password shows invalid-credentials error', async ({ page }) => {
    const loginPage = new PageFactory(page).login();

    // Enter the correct username with a wrong password
    await loginPage.login('demo', 'wrongpassword');

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Overview' })).not.toBeVisible();
  });

  test('both fields wrong shows invalid-credentials error', async ({ page }) => {
    const loginPage = new PageFactory(page).login();

    await loginPage.login('bad', 'creds');

    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('error message clears when user edits the username field', async ({ page }) => {
    const loginPage = new PageFactory(page).login();

    // Trigger the error first
    await loginPage.login('wrong', 'demo123');
    await expect(loginPage.errorMessage).toBeVisible();

    // Editing the username field should clear the error (per app behaviour)
    await loginPage.usernameInput.fill('d');
    await expect(loginPage.errorMessage).not.toBeVisible();
  });

  test('Enter key on password field submits the form and logs in', async ({ page }) => {
    const loginPage = new PageFactory(page).login();

    // Submit via Enter instead of clicking the Sign In button
    await loginPage.loginViaEnterKey('demo', 'demo123');

    // Should land on the Dashboard
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('Enter key on password field with wrong credentials shows error', async ({ page }) => {
    const loginPage = new PageFactory(page).login();

    await loginPage.loginViaEnterKey('demo', 'bad');

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Overview' })).not.toBeVisible();
  });

  test('username field placeholder is exactly "demo" (strict selector sanity check)', async ({ page }) => {
    const loginPage = new PageFactory(page).login();

    // Verify the exact-match locator resolves to exactly one element (no strict-mode violation)
    await expect(loginPage.usernameInput).toHaveCount(1);
    await expect(loginPage.usernameInput).toBeVisible();
  });

  test('password field placeholder is exactly "demo123" (strict selector sanity check)', async ({ page }) => {
    const loginPage = new PageFactory(page).login();

    // Verify the exact-match locator resolves to exactly one element
    await expect(loginPage.passwordInput).toHaveCount(1);
    await expect(loginPage.passwordInput).toBeVisible();
  });
});

test.describe('Sign Out', () => {
  test('signing out returns user to the login screen', async ({ page }) => {
    const factory = new PageFactory(page);
    const loginPage = factory.login();

    // Log in first
    await loginPage.goto();
    await loginPage.loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Click Sign Out in the sidebar
    await page.getByRole('button', { name: /sign out/i }).click();

    // The login screen should be visible again
    await expect(loginPage.signInButton).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Overview' })).not.toBeVisible();
  });
});
