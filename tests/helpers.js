// Shared E2E helpers for Billable (Pro Consulting Tracker).
//
// The app is local-first: localStorage is the source of truth and Supabase is
// only a sync layer. These helpers keep every test hermetic and offline by
// blocking the Supabase backend and seeding state directly into localStorage.
const base = require('@playwright/test');

const PIN = '3007';

// localStorage keys (kept in sync with index.html).
const K = {
  sessions: 'pct_sessions_v3',
  customers: 'pct_customers_v1',
  biz: 'pct_business_v1',
};

// Extend the base test so every test automatically runs offline: the real
// Supabase project is never contacted, so tests are deterministic and never
// mutate live data. Sign-in fails gracefully in the app (sync badge -> error).
const test = base.test.extend({
  page: async ({ page }, use) => {
    await page.route(/supabase\.co/, (route) => route.abort());
    const errors = [];
    page.on('pageerror', (err) => errors.push(err));
    await use(page);
    // Fail loudly on uncaught page exceptions during a test.
    if (errors.length) {
      throw new Error('Uncaught page error(s):\n' + errors.map((e) => e.stack || e.message).join('\n'));
    }
  },
});

const expect = base.expect;

// ISO timestamp `mins` minutes from now (negative = in the past).
function isoFromNow(mins) {
  return new Date(Date.now() + mins * 60000).toISOString();
}

// Build a completed session. Defaults to a 1h session that ended an hour ago.
function doneSession(overrides = {}) {
  const startMin = overrides.startMin ?? -120;
  const endMin = overrides.endMin ?? -60;
  return {
    id: overrides.id || 'sess-' + Math.abs(startMin) + '-' + (overrides.customer || 'x'),
    customer: overrides.customer || 'Acme Corp',
    startTime: isoFromNow(startMin),
    endTime: isoFromNow(endMin),
    breaks: overrides.breaks || [],
    notes: overrides.notes || '',
    paymentStatus: overrides.paymentStatus || 'invoice_not_sent',
    invoiceSentAt: overrides.invoiceSentAt || null,
    paidAt: overrides.paidAt || null,
  };
}

const CUSTOMERS = [
  { name: 'Acme Corp', rate: 100, rateModel: 'per_hour' },
  { name: 'Globex', rate: 50, rateModel: 'per_hour' },
];

// Load the app and seed localStorage BEFORE login. The app runs load() once at
// boot (empty storage) and again inside initApp() when the PIN is accepted, so
// seeding here means the seeded state is what the logged-in app reads.
async function openApp(page, seed = {}) {
  await page.goto('/index.html');
  await page.evaluate(
    ({ K, seed }) => {
      if (seed.sessions) localStorage.setItem(K.sessions, JSON.stringify(seed.sessions));
      if (seed.customers) localStorage.setItem(K.customers, JSON.stringify(seed.customers));
      if (seed.biz) localStorage.setItem(K.biz, JSON.stringify(seed.biz));
    },
    { K, seed }
  );
  await login(page);
}

async function login(page, pin = PIN) {
  for (const d of pin) {
    await page.getByRole('button', { name: d, exact: true }).click();
  }
}

async function switchTab(page, name) {
  await page.locator(`.tab-btn[data-tab="${name}"]`).click();
  await expect(page.locator(`#tab-${name}`)).toBeVisible();
}

module.exports = {
  test,
  expect,
  PIN,
  K,
  CUSTOMERS,
  isoFromNow,
  doneSession,
  openApp,
  login,
  switchTab,
};
