const { test, expect, openApp, doneSession, switchTab, CUSTOMERS } = require('../helpers');

// Two completed Acme sessions this month, billed at ₪100/hour.
function seed() {
  return {
    customers: CUSTOMERS,
    sessions: [
      doneSession({ id: 'r1', customer: 'Acme Corp', startMin: -180, endMin: -120 }),
      doneSession({ id: 'r2', customer: 'Acme Corp', startMin: -100, endMin: -40 }),
    ],
    biz: { name: 'Beasymom ltd', regId: '123456789', address: 'Tel Aviv', phone: '050', email: 'x@y.com' },
  };
}

test.describe('Reports — invoice generation', () => {
  test('generate an invoice for a client', async ({ page }) => {
    await openApp(page, seed());
    await switchTab(page, 'reports');

    await page.locator('#report-customer').selectOption('Acme Corp');
    await page.getByRole('button', { name: 'Generate Report' }).click();

    // Invoice document renders and the export buttons appear.
    await expect(page.locator('#invoice-doc')).toBeVisible();
    await expect(page.locator('#report-download-btn')).toBeVisible();
    await expect(page.locator('#report-print-btn')).toBeVisible();
    // The client's business identity flows into the invoice.
    await expect(page.locator('#invoice-doc')).toContainText('Acme Corp');
  });

  test('generating with no client selected shows a hint', async ({ page }) => {
    await openApp(page, seed());
    await switchTab(page, 'reports');

    await page.locator('#report-customer').selectOption('');
    await page.getByRole('button', { name: 'Generate Report' }).click();

    await expect(page.locator('#report-note')).toContainText('select a client');
    await expect(page.locator('#invoice-doc')).toHaveCount(0);
  });

  test('no matching sessions reports an empty result', async ({ page }) => {
    await openApp(page, seed());
    await switchTab(page, 'reports');

    await page.locator('#report-customer').selectOption('Globex'); // has no sessions
    await page.getByRole('button', { name: 'Generate Report' }).click();

    await expect(page.locator('#report-note')).toContainText('No completed sessions');
    await expect(page.locator('#invoice-doc')).toHaveCount(0);
  });
});
