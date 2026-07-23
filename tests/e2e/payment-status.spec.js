const { test, expect, openApp, doneSession, switchTab, CUSTOMERS } = require('../helpers');

test.describe('Payment status workflow', () => {
  test('not-invoiced -> invoice sent -> paid (with date)', async ({ page }) => {
    const s = doneSession({ id: 'p1', customer: 'Acme Corp', paymentStatus: 'invoice_not_sent' });
    await openApp(page, { customers: CUSTOMERS, sessions: [s] });
    await switchTab(page, 'history');

    const badge = page.locator('.session-card.is-done .badge-ps');
    await expect(badge).toHaveText('Not Invoiced');

    // -> Invoice Sent
    await page.locator('.session-card.is-done .menu-trigger').click();
    await page.locator('#ps-btn-sent').click();
    await expect(badge).toHaveText('Invoice Sent');
    await expect(page.locator('.session-card.is-done')).toContainText('Invoiced');

    // -> Paid (opens date sheet, confirm with prefilled today)
    await page.locator('.session-card.is-done .menu-trigger').click();
    await page.locator('#ps-btn-paid').click();
    await expect(page.locator('#payment-date-sheet')).toHaveClass(/open/);
    await page.getByRole('button', { name: 'Confirm Payment' }).click();

    await expect(badge).toHaveText('Paid');
    await expect(page.locator('.session-card.is-done')).toContainText('Paid');
  });

  test('paid badge persists after reload', async ({ page }) => {
    const s = doneSession({ id: 'p2', customer: 'Acme Corp', paymentStatus: 'invoice_not_sent' });
    await openApp(page, { customers: CUSTOMERS, sessions: [s] });
    await switchTab(page, 'history');

    await page.locator('.session-card.is-done .menu-trigger').click();
    await page.locator('#ps-btn-paid').click();
    await page.getByRole('button', { name: 'Confirm Payment' }).click();
    await expect(page.locator('.session-card.is-done .badge-ps')).toHaveText('Paid');

    await page.reload();
    for (const d of '3007') await page.getByRole('button', { name: d, exact: true }).click();
    await switchTab(page, 'history');

    await expect(page.locator('.session-card.is-done .badge-ps')).toHaveText('Paid');
  });
});
