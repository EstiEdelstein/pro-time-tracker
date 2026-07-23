# E2E tests

End-to-end tests for **Billable** (the single-file app in `../index.html`), using
[Playwright](https://playwright.dev). They drive a real Chromium against the app
served as a static file, covering the main user workflows.

The repo is intentionally dependency-free (no committed `package.json`), so
Playwright is installed **globally** rather than as a project dependency.

## One-time setup

```bash
npm install -g @playwright/test
playwright install chromium
```

You also need `python3` (used to serve `index.html`) — preinstalled on macOS.

## Running

```bash
./tests/run.sh              # run everything, headless
./tests/run.sh --headed     # watch it run in a browser
./tests/run.sh --ui         # Playwright UI mode
./tests/run.sh login        # run one spec by name substring
```

`run.sh` sets `NODE_PATH` to the global module dir so the specs can resolve
`@playwright/test`, then runs the standalone `playwright.config.js`.

## How it works

- **Offline & hermetic.** The app is local-first: `localStorage` is the source of
  truth and Supabase is only a sync layer. `helpers.js` blocks all `*.supabase.co`
  requests, so tests never touch (or mutate) the live backend and are fully
  deterministic. Sign-in fails gracefully in the app, exactly as it would offline.
- **State seeding.** `openApp(page, { sessions, customers, biz })` loads the app and
  writes seed data into `localStorage` *before* entering the PIN. The app reads that
  storage when it initializes on login, so each test starts from a known state.
- **PIN.** Login uses the app's PIN (`3007`).

## Coverage

| Spec | Workflow |
|------|----------|
| `login.spec.js` | PIN unlock, wrong-PIN error, sign out |
| `session-lifecycle.spec.js` | Start (known / ad-hoc client / validation), stop, edit, delete, persistence |
| `history-filters.spec.js` | Summary bar, earnings toggle, payment/client/month filters, empty state |
| `payment-status.spec.js` | Not-invoiced → invoice sent → paid (with date), persistence |
| `settings-clients.spec.js` | Add/remove client, set rate + billing model, picker integration |
| `reports-invoice.spec.js` | Invoice generation, no-client and no-match hints |

## Notes

- Tests run at a desktop viewport so the Reports tab and history client filter
  (both gated behind a `min-width: 768px` media query) are reachable.
- If the app's DOM ids, button labels, or `localStorage` keys change, update the
  selectors in `helpers.js` and the affected spec.
