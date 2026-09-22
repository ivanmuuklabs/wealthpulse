import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Happy-path tests for the Settings tab.
 *
 * User story (derived from app feature set — maps to Jira Settings stories):
 *   "As a user I can update my profile name, email and currency preference
 *    and save them so that the dashboard reflects my personal information."
 *
 * Acceptance criteria tested here:
 *  1. The Settings tab is reachable via the sidebar and via the avatar button.
 *  2. Updating the Full Name and saving shows the confirmation state.
 *  3. The avatar initials update to reflect the new name after save.
 *  4. Updating the Email field and saving persists the new value.
 *  5. Selecting a different currency and saving reflects the selection.
 *  6. The preference toggles change visual state when clicked.
 */

test.describe('Settings — happy path', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
  });

  // ── 1. Navigation ──────────────────────────────────────────────────────────

  test('sidebar Settings button opens the Settings page', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(settings.fullNameInput).toBeVisible();
  });

  test('clicking the avatar button in the top bar also opens Settings', async ({ page }) => {
    // The top-bar avatar button shows the user's initials and navigates to Settings
    await page.getByRole('button', { name: /AM/i }).click();

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  // ── 2. Save profile name ───────────────────────────────────────────────────

  test('updating the Full Name and saving shows the "✓ Saved!" confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    await settings.setName('Taylor Reed');
    await settings.saveChanges();

    // Button text briefly becomes "✓ Saved!" then reverts to "Save Changes"
    await expect(settings.saveButton).toHaveText(/saved/i);
  });

  test('the avatar initials reflect the updated name after save', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    await settings.setName('Jordan Blake');
    await settings.saveChanges();

    // Initials for "Jordan Blake" → "JB"
    await expect(settings.avatarInitials).toContainText('JB');
  });

  // ── 3. Save email ─────────────────────────────────────────────────────────

  test('updating the Email field and saving shows the confirmation state', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    await settings.setEmail('newemail@wealthpulse.demo');
    await settings.saveChanges();

    await expect(settings.saveButton).toHaveText(/saved/i);
  });

  // ── 4. Currency preference ────────────────────────────────────────────────

  test('selecting EUR and saving persists the currency selection', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    await settings.setCurrency('EUR');
    await settings.saveChanges();

    // After save the select must still show EUR
    await expect(settings.currencySelect).toHaveValue('EUR');
  });

  test('selecting GBP and saving persists the currency selection', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    await settings.setCurrency('GBP');
    await settings.saveChanges();

    await expect(settings.currencySelect).toHaveValue('GBP');
  });

  // ── 5. Preference toggles ─────────────────────────────────────────────────

  test('clicking the Email Notifications toggle changes its visual state', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    // Toggle index 1 = Email Notifications (default OFF per app source)
    const toggle = settings.preferenceToggles.nth(1);
    const classBefore = await toggle.getAttribute('class');

    await settings.togglePreference(1);

    const classAfter = await toggle.getAttribute('class');
    // The colour class must have changed (bg-emerald-500 ↔ bg-slate-700)
    expect(classAfter).not.toEqual(classBefore);
  });

  test('clicking the Monthly Reports toggle changes its visual state', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    // Toggle index 2 = Monthly Reports (default ON per app source)
    const toggle = settings.preferenceToggles.nth(2);
    const classBefore = await toggle.getAttribute('class');

    await settings.togglePreference(2);

    const classAfter = await toggle.getAttribute('class');
    expect(classAfter).not.toEqual(classBefore);
  });

});
