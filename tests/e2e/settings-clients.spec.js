const { test, expect, openApp, CUSTOMERS } = require('../helpers');

async function openSettings(page) {
  await page.locator('.avatar-btn').click();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.locator('#modal-settings')).toHaveClass(/open/);
}

test.describe('Settings — client management', () => {
  test('add a new client', async ({ page }) => {
    await openApp(page, { customers: CUSTOMERS });
    await openSettings(page);

    await expect(page.locator('.client-row')).toHaveCount(2);
    await page.locator('#add-client-input').fill('New Client Co');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.locator('.client-row')).toHaveCount(3);
    await expect(page.locator('.client-name', { hasText: 'New Client Co' })).toBeVisible();
  });

  test('new client is available in the start-session picker', async ({ page }) => {
    await openApp(page, { customers: CUSTOMERS });
    await openSettings(page);
    await page.locator('#add-client-input').fill('Umbrella Inc');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.locator('.settings-close').click();

    await page.locator('.start-btn').click();
    const options = await page.locator('#customer-select option').allTextContents();
    expect(options).toContain('Umbrella Inc');
  });

  test('set a billing rate and model, and it persists', async ({ page }) => {
    await openApp(page, { customers: CUSTOMERS });
    await openSettings(page);

    // First client row = Acme Corp.
    const acmeRow = page.locator('.client-row').first();
    await acmeRow.locator('.client-rate-input').fill('250');
    await acmeRow.locator('.client-rate-input').blur();
    await acmeRow.locator('.client-model-select').selectOption('per_day');

    // Reopen settings and confirm the values stuck.
    await page.locator('.settings-close').click();
    await openSettings(page);
    await expect(page.locator('.client-row').first().locator('.client-rate-input')).toHaveValue('250');
    await expect(page.locator('.client-row').first().locator('.client-model-select')).toHaveValue('per_day');
  });

  test('remove a client', async ({ page }) => {
    await openApp(page, { customers: CUSTOMERS });
    await openSettings(page);

    await expect(page.locator('.client-row')).toHaveCount(2);
    await page.locator('.client-row').first().locator('.client-del').click();
    await expect(page.locator('.client-row')).toHaveCount(1);
    await expect(page.locator('.client-name')).toHaveText('Globex');
  });
});
