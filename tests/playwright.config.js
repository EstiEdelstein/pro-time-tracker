// Standalone Playwright config. The repo stays dependency-free (no committed
// package.json); Playwright is installed globally. Run via ./tests/run.sh,
// which sets NODE_PATH so the global @playwright/test resolves.
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const PORT = 8123;
const repoRoot = path.resolve(__dirname, '..');

module.exports = defineConfig({
  testDir: path.join(__dirname, 'e2e'),
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(__dirname, 'playwright-report'), open: 'never' }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Desktop viewport (>=768px) so the Reports tab and client filter — both
    // gated behind a desktop media query — are reachable.
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1`,
    cwd: repoRoot,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
