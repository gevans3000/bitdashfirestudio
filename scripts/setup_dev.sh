#!/usr/bin/env bash
# Run once: installs all dev-tools locally so Codex finds them.

set -e
echo "▶ Installing dev-dependencies via npm ci…"
npm ci

echo "▶ Done.  You can now run:"
echo "   npm run lint   # ESLint"
echo "   npm run test   # Jest"
echo "   npm run backtest"
echo "   npm run commitlog"
