#!/usr/bin/env bash
# Run the Billable E2E suite.
#
# The repo is intentionally dependency-free (no committed package.json), so
# Playwright is installed GLOBALLY. This script points NODE_PATH at the global
# module dir so the spec files can resolve `@playwright/test`, then runs the
# global playwright CLI against the standalone config.
#
# One-time setup:
#   npm install -g @playwright/test
#   playwright install chromium
#
# Usage:
#   ./tests/run.sh                # run everything (headless)
#   ./tests/run.sh --headed       # watch it run
#   ./tests/run.sh login          # run a single spec by name
#   ./tests/run.sh --ui           # Playwright UI mode
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GLOBAL_ROOT="$(npm root -g)"
export NODE_PATH="$GLOBAL_ROOT"

if [ ! -d "$GLOBAL_ROOT/@playwright/test" ]; then
  echo "Playwright is not installed globally. Run:" >&2
  echo "  npm install -g @playwright/test && playwright install chromium" >&2
  exit 1
fi

exec playwright test --config "$DIR/playwright.config.js" "$@"
