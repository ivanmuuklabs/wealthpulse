import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings tab — happy path and negative tests.
 *
 * User stories covered:
 *   WP-301  As a user I can update my profile name and email so they reflect my identity.
 *   WP-302  As a user I can change the display currency so monetary values match my region.
 *   WP-303  As a user I receive visual confirmation when my profile changes are saved.
 *   WP-304  As a user I can toggle preference switches (Dark Mode, Email Notifications,
 *           Monthly Reports) to control my experience.
 */

test.describe('Settings — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  // WP-301: Settings page renders the profile form
  test('Settings page shows the Profile Information section with editable fields', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await expect(settingsPage.heading).toBeVisible();
    await expect(settingsPage.nameInput).toBeVisible();
    await expect(settingsPage.emailInput).toBeVisible();
    await expect(settingsPage.currencySelect).toBeVisible();
    await expect(settingsPage.saveButton).toBeVisible();
  });

  // WP-301: Update name
  test('updating the full name and saving reflects the new name in the profile card', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.setName('Jordan Blake');
    await settingsPage.save();

    // The avatar initials in the profile card inside Settings update to JB
    await expect(page.getByText('Jordan Blake').first()).toBeVisible();
  });

  // WP-303: Save shows "✓ Saved!" confirmation
  test('clicking Save Changes shows a transient "✓ Saved!" confirmation', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.save();

    // The button text changes to "✓ Saved!" briefly
    await expect(settingsPage.savedConfirmation).toBeVisible();
  });

  // WP-302: Currency change persists in dropdown after save
  test('selecting EUR and saving keeps EUR selected in the currency dropdown', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.setCurrency('EUR');
    await settingsPage.save();

    await expect(settingsPage.currencySelect).toHaveValue('EUR');
  });

  // WP-304: Preference toggle switches are visible
  test('Settings page displays the three preference toggles', async ({ page }) => {
    await expect(page.getByText('Dark Mode')).toBeVisible();
    await expect(page.getByText('Email Notifications')).toBeVisible();
    await expect(page.getByText('Monthly Reports')).toBeVisible();
  });

  // WP-304: Toggling a switch changes its state
  test('clicking the Email Notifications toggle changes its checked state', async ({ page }) => {
    // Locate the toggle button next to "Email Notifications"
    const toggleButton = page
      .locator('label', { hasText: 'Email Notifications' })
      .locator('button');

    // Capture the initial bg class (off = bg-slate-700, on = bg-emerald-500)
    const classBefore = await toggleButton.getAttribute('class');
    await toggleButton.click();
    const classAfter = await toggleButton.getAttribute('class');

    expect(classBefore).not.toEqual(classAfter);
  });

  // WP-301: Update email
  test('updating the email field and saving reflects the new email', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.setEmail('jordan@wealthpulse.demo');
    await settingsPage.save();

    await expect(settingsPage.emailInput).toHaveValue('jordan@wealthpulse.demo');
  });
});

test.describe('Settings — negative path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.settings().navigate();
  });

  // WP-301: Clearing the name field and saving — the field should not crash
  test('saving with an empty name field does not navigate away from Settings', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.setName('');
    await settingsPage.save();

    // Should remain on the Settings page
    await expect(settingsPage.heading).toBeVisible();
  });

  // WP-301: Clearing the email field and saving
  test('saving with an empty email does not navigate away from Settings', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.setEmail('');
    await settingsPage.save();

    await expect(settingsPage.heading).toBeVisible();
  });

  // WP-303: "✓ Saved!" label auto-hides after the timeout
  test('"✓ Saved!" confirmation disappears after a short delay', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    await settingsPage.save();
    await expect(settingsPage.savedConfirmation).toBeVisible();

    // The app resets the label after 2 000 ms — allow up to 4 s for it to vanish
    await expect(settingsPage.saveButton).toBeVisible({ timeout: 4000 });
  });

  // WP-302: Currency dropdown only exposes the three known options
  test('currency dropdown contains exactly USD, EUR and GBP options', async ({ page }) => {
    const settingsPage = new PageFactory(page).settings();

    const options = await settingsPage.currencySelect.locator('option').allTextContents();

    // Normalise text and check membership
    const normalised = options.map(o => o.trim());
    expect(normalised.some(o => o.startsWith('USD'))).toBe(true);
    expect(normalised.some(o => o.startsWith('EUR'))).toBe(true);
    expect(normalised.some(o => o.startsWith('GBP'))).toBe(true);
    // No unexpected fourth option
    expect(normalised.length).toBe(3);
  });

  // WP-304: Toggling Dark Mode twice restores the original state
  test('toggling Dark Mode switch twice returns it to its original state', async ({ page }) => {
    const toggleButton = page
      .locator('label', { hasText: 'Dark Mode' })
      .locator('button');

    const classBefore = await toggleButton.getAttribute('class');

    await toggleButton.click(); // off
    await toggleButton.click(); // back on
    const classAfter = await toggleButton.getAttribute('class');

    expect(classBefore).toEqual(classAfter);
  });
});
