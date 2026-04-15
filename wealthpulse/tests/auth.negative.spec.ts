import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test('login with invalid credentials shows error message', async ({ page }) => {
  const loginPage = new PageFactory(page).login();
  await loginPage.goto();
  await loginPage.login('wrong', 'password');

  // Error message must be visible
  await expect(page.getByText('Invalid credentials. Use demo / demo123')).toBeVisible();

  // User must remain on the login screen — Dashboard heading should NOT appear
  await expect(page.getByRole('heading', { name: 'Overview' })).not.toBeVisible();
});
