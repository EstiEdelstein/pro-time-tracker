const { test, expect, openApp, doneSession, isoFromNow, switchTab, CUSTOMERS } = require('../helpers');

// Three completed sessions in the current month, mixed clients + statuses.
function seed() {
  return {
    customers: CUSTOMERS,
    sessions: [
      doneSession({ id: 'h1', customer: 'Acme Corp', paymentStatus: 'invoice_not_sent' }),
      doneSession({ id: 'h2', customer: 'Acme Corp', paymentStatus: 'paid', paidAt: isoFromNow(-30) }),
      doneSession({ id: 'h3', customer: 'Globex', paymentStatus: 'invoice_sent', invoiceSentAt: isoFromNow(-40) }),
    ],
  };
}

test.describe('History filters & summary', () => {
  test('summary bar reflects all sessions', async ({ page }) => {
    await openApp(page, seed());
    await switchTab(page, 'history');
    await page.locator('#month-filter').selectOption('all');

    await expect(page.locator('.session-card.is-done')).toHaveCount(3);
    // Summary: Sessions | Total | Clients | Job %
    await expect(page.locator('.summary-bar .stat-val').first()).toHaveText('3');
    await expect(page.locator('.summary-bar .stat-val').nth(2)).toHaveText('2'); // distinct clients
  });

  test('earnings toggle switches Total from hours to shekels', async ({ page }) => {
    await openApp(page, seed());
    await switchTab(page, 'history');
    await page.locator('#month-filter').selectOption('all');

    // Default shows hours.
    const total = page.locator('.summary-bar .stat-val').nth(1);
    await expect(total).toContainText('h');

    await page.locator('.stat-coin-btn').click();
    await expect(page.locator('.stat-val.earnings')).toContainText('₪');
  });

  test('payment-status filter narrows the list', async ({ page }) => {
    await openApp(page, seed());
    await switchTab(page, 'history');
    await page.locator('#month-filter').selectOption('all');

    await page.locator('#payment-filter').selectOption('paid');
    await expect(page.locator('.session-card.is-done')).toHaveCount(1);
    await expect(page.locator('.session-card.is-done .badge-ps')).toHaveText('Paid');
  });

  test('client filter narrows the list', async ({ page }) => {
    await openApp(page, seed());
    await switchTab(page, 'history');
    await page.locator('#month-filter').selectOption('all');

    await page.locator('#client-filter').selectOption('Globex');
    await expect(page.locator('.session-card.is-done')).toHaveCount(1);
    await expect(page.locator('.session-card.is-done .card-customer')).toHaveText('Globex');
  });

  test('a month with no sessions shows the empty state', async ({ page }) => {
    await openApp(page, seed());
    await switchTab(page, 'history');

    // Six months ago is the last option built and has no seeded sessions.
    const options = await page.locator('#month-filter option').evaluateAll((els) =>
      els.map((e) => e.value)
    );
    await page.locator('#month-filter').selectOption(options[options.length - 1]);

    await expect(page.locator('.session-card.is-done')).toHaveCount(0);
    await expect(page.locator('#history-list .empty-state')).toBeVisible();
  });
});
