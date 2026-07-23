const { test, expect, openApp, doneSession, switchTab, CUSTOMERS } = require('../helpers');

test.describe('Session lifecycle', () => {
  test('start a session from a known client', async ({ page }) => {
    await openApp(page, { customers: CUSTOMERS });

    await page.locator('.start-btn').click();
    await expect(page.locator('#modal-start')).toHaveClass(/open/);

    await page.locator('#customer-select').selectOption('Acme Corp');
    await page.locator('#start-notes').fill('Kickoff call');
    await page.getByRole('button', { name: 'Start Now' }).click();

    const card = page.locator('.session-card.is-active');
    await expect(card).toHaveCount(1);
    await expect(card.locator('.card-customer')).toHaveText('Acme Corp');
    await expect(card.locator('.badge-live')).toBeVisible();
    await expect(card.locator('.card-note')).toHaveText('Kickoff call');
  });

  test('start a session with a custom (ad-hoc) client name', async ({ page }) => {
    await openApp(page, { customers: CUSTOMERS });

    await page.locator('.start-btn').click();
    await page.locator('#customer-select').selectOption('__custom__');
    await expect(page.locator('#custom-name-group')).toBeVisible();
    await page.locator('#custom-name-input').fill('Walk-in Client');
    await page.getByRole('button', { name: 'Start Now' }).click();

    await expect(page.locator('.session-card.is-active .card-customer')).toHaveText('Walk-in Client');
  });

  test('starting with no client selected is blocked', async ({ page }) => {
    await openApp(page, { customers: CUSTOMERS });

    await page.locator('.start-btn').click();
    await page.locator('#customer-select').selectOption(''); // the empty "Select..." option
    await page.getByRole('button', { name: 'Start Now' }).click();

    // Validation sheet appears; no active session created.
    await expect(page.locator('#confirm-sheet')).toHaveClass(/open/);
    await expect(page.locator('.session-card.is-active')).toHaveCount(0);
  });

  test('stop an active session moves it to history', async ({ page }) => {
    const active = { ...doneSession({ customer: 'Acme Corp' }), endTime: null, id: 'live-1' };
    await openApp(page, { customers: CUSTOMERS, sessions: [active] });

    await expect(page.locator('.session-card.is-active')).toHaveCount(1);
    await page.locator('.session-card.is-active .btn-xs.stop').click();

    await expect(page.locator('.session-card.is-active')).toHaveCount(0);

    await switchTab(page, 'history');
    await expect(page.locator('.session-card.is-done')).toHaveCount(1);
    await expect(page.locator('.session-card.is-done .card-customer')).toHaveText('Acme Corp');
  });

  test('edit a completed session updates client and notes', async ({ page }) => {
    const s = doneSession({ customer: 'Acme Corp', notes: 'old note', id: 'edit-1' });
    await openApp(page, { customers: CUSTOMERS, sessions: [s] });

    await switchTab(page, 'history');
    await page.locator('.session-card.is-done .menu-trigger').click();
    await page.locator('#action-sheet-edit').click();
    await expect(page.locator('#modal-edit')).toHaveClass(/open/);

    await page.locator('#edit-customer').fill('Globex');
    await page.locator('#edit-notes').fill('updated note');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    const card = page.locator('.session-card.is-done');
    await expect(card.locator('.card-customer')).toHaveText('Globex');
    await expect(card.locator('.card-note')).toHaveText('updated note');
  });

  test('delete a completed session (with confirmation)', async ({ page }) => {
    const s = doneSession({ customer: 'Acme Corp', id: 'del-1' });
    await openApp(page, { customers: CUSTOMERS, sessions: [s] });

    await switchTab(page, 'history');
    await page.locator('.session-card.is-done .menu-trigger').click();
    await page.locator('#action-sheet-delete').click();

    // Confirmation sheet, then confirm.
    await expect(page.locator('#confirm-sheet')).toHaveClass(/open/);
    await page.locator('#confirm-sheet-ok').click();

    await expect(page.locator('.session-card.is-done')).toHaveCount(0);
    await expect(page.locator('#history-list .empty-state')).toBeVisible();
  });

  test('started session survives a reload (persisted to localStorage)', async ({ page }) => {
    await openApp(page, { customers: CUSTOMERS });

    await page.locator('.start-btn').click();
    await page.locator('#customer-select').selectOption('Globex');
    await page.getByRole('button', { name: 'Start Now' }).click();
    await expect(page.locator('.session-card.is-active')).toHaveCount(1);

    // Reload and log back in — no re-seed, so this reads persisted state.
    await page.reload();
    for (const d of '3007') await page.getByRole('button', { name: d, exact: true }).click();

    await expect(page.locator('.session-card.is-active .card-customer')).toHaveText('Globex');
  });
});
