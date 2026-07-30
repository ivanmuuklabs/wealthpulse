import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await factory.settings().navigate();
});

// ─── Navigation ───────────────────────────────────────────────────────────────

test('Settings page renders profile form and preferences section', async ({ page }) => {
  // Page heading
  await expect(page.locator('h2').filter({ hasText: /settings/i })).toBeVisible();

  // Profile Information card heading
  await expect(page.locator('h3').filter({ hasText: /profile information/i })).toBeVisible();

  // Preferences card heading
  await expect(page.locator('h3').filter({ hasText: /preferences/i })).toBeVisible();

  // The avatar shows the initials "AM" (Alex Morgan, the seeded user)
  const avatarInitials = page
    .locator('div')
    .filter({ hasText: /^AM$/ })
    .first();
  await expect(avatarInitials).toBeVisible();
});

// ─── Profile save ─────────────────────────────────────────────────────────────

// Updating the Full Name field and clicking Save should persist the value and
// momentarily show a "✓ Saved!" confirmation on the button.
test('saving a new name updates the profile and shows the saved confirmation', async ({ page }) => {
  const settingsPage = new PageFactory(page).settings();

  // The name input is pre-filled with the seeded value "Alex Morgan"
  await expect(settingsPage.nameInput).toHaveValue('Alex Morgan');

  await settingsPage.updateName('Jordan Lee');
  await settingsPage.saveProfile();

  // The save button briefly shows the confirmation state
  await expect(settingsPage.savedConfirmation).toBeVisible();

  // After the confirmation fades the button returns to "Save Changes"
  await expect(settingsPage.saveButton).toBeVisible({ timeout: 5000 });

  // The avatar in the profile card should now show the new initials "JL"
  const updatedAvatar = page
    .locator('div')
    .filter({ hasText: /^JL$/ })
    .first();
  await expect(updatedAvatar).toBeVisible();
});

// Updating the email and saving persists the new value
test('saving a new email keeps the input updated', async ({ page }) => {
  const settingsPage = new PageFactory(page).settings();

  await settingsPage.updateEmail('jordan@example.com');
  await settingsPage.saveProfile();

  await expect(settingsPage.savedConfirmation).toBeVisible();

  // After save the input should still hold the new email
  await expect(settingsPage.emailInput).toHaveValue('jordan@example.com');
});

// Selecting a different currency and saving is reflected in the select
test('changing currency to EUR saves successfully', async ({ page }) => {
  const settingsPage = new PageFactory(page).settings();

  await settingsPage.selectCurrency('EUR');
  await settingsPage.saveProfile();

  await expect(settingsPage.savedConfirmation).toBeVisible();
  await expect(settingsPage.currencySelect).toHaveValue('EUR');
});

// ─── Preferences toggles ──────────────────────────────────────────────────────

// The Preferences card lists three toggle switches.  Clicking one should flip
// its visual state without throwing an error.
test('toggling the Email Notifications preference switch changes its state', async ({ page }) => {
  // The three toggle labels are "Dark Mode", "Email Notifications", "Monthly Reports"
  const emailNotifToggle = page
    .locator('label')
    .filter({ hasText: /email notifications/i })
    .locator('button');

  // Capture initial CSS classes (on = bg-emerald-500, off = bg-slate-700)
  const classBefore = await emailNotifToggle.getAttribute('class');

  await emailNotifToggle.click();

  const classAfter = await emailNotifToggle.getAttribute('class');

  // The class string should have changed after the click
  expect(classAfter).not.toBe(classBefore);
});

// ─── Sign Out ─────────────────────────────────────────────────────────────────

// Clicking "Sign Out" from any page should return the user to the login screen.
test('clicking Sign Out returns to the login screen', async ({ page }) => {
  const signOutButton = page.getByRole('button', { name: /sign out/i });
  await expect(signOutButton).toBeVisible();

  await signOutButton.click();

  // After logout the login form should be visible again
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  await expect(page.getByPlaceholder('demo')).toBeVisible();
});
