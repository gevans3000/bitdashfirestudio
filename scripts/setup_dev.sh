#!/usr/bin/env bash
# Run once: installs all dev-tools locally so Codex finds them.

set -e
echo "▶ Installing dev-dependencies…"
npm install --save-dev \
  eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  jest ts-jest @types/jest \
  ts-node typescript @types/node

echo "▶ Done.  You can now run:"
echo "   npm run lint   # ESLint"
echo "   npm run test   # Jest"
echo "   npm run backtest"
echo "   npm run commitlog"
