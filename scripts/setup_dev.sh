#!/usr/bin/env bash
# Run once: installs all dev-tools locally so Codex finds them.

set -e
echo "▶ Checking npm environment..."

# Force package-lock.json to be in sync with package.json
echo "▶ Updating package-lock.json to match package.json..."
npm install --package-lock-only

# Now that package-lock.json is updated, proceed with npm ci
echo "▶ Installing dependencies via npm ci..."
npm ci || {
  echo "▶ npm ci failed, falling back to npm install..."
  npm install
}

# Ensure specific dev dependencies are installed
echo "▶ Installing specific dev dependencies..."
npm install --save-dev \
  eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  jest ts-jest @types/jest \
  ts-node typescript @types/node

echo "▶ Done.  You can now run:"
echo "   npm run lint   # ESLint"
echo "   npm run test   # Jest"
echo "   npm run backtest"
echo "   npm run commitlog"