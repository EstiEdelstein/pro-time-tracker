const { test, expect, openApp, login } = require('../helpers');

test.describe('PIN login', () => {
  test('correct PIN unlocks the app', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#screen-login')).toHaveClass(/active/);

    await login(page);

    await expect(page.locator('#screen-app')).toHaveClass(/active/);
    await expect(page.locator('#screen-login')).not.toHaveClass(/active/);
    await expect(page.locator('.start-btn')).toBeVisible();
  });

  test('wrong PIN shows an error and stays on login', async ({ page }) => {
    await page.goto('/index.html');
    await login(page, '1234');

    await expect(page.locator('#login-error')).toHaveText(/Incorrect PIN/);
    await expect(page.locator('#screen-app')).not.toHaveClass(/active/);
  });

  test('sign out returns to the login screen', async ({ page }) => {
    await openApp(page);

    await page.locator('.avatar-btn').click();
    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page.locator('#screen-login')).toHaveClass(/active/);
    await expect(page.locator('#screen-app')).not.toHaveClass(/active/);
  });
});
