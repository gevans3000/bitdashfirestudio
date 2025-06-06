#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Bootstraps a local + Codex/CI dev environment for gevans3000/bitdashfirestudio
# ---------------------------------------------------------------------------
# • Syncs package-lock, installs Node via nvm (or NodeSource fallback).
# • Installs npm deps (ci-first), dev-tooling, and optional Python deps.
# • Rebuilds native bindings for current arch.
# • Idempotent: safe to run multiple times; exits non-zero on failure.
# ---------------------------------------------------------------------------

# ── Self-healing exec permission ──────────────────────────────────────────
if [[ ! -x "$0" && -f "$0" ]]; then
  echo "▶ Fixing script permissions…"
  chmod +x "$0"
  echo "▶ Permissions fixed."
fi

set -euo pipefail
echo "▶ Bootstrapping dev environment…"

# ── Node setup ───────────────────────────────────────────────────────────
NODE_VERSION="${NODE_VERSION:-$(cat .nvmrc 2>/dev/null || echo 18)}"

if command -v nvm >/dev/null 2>&1; then
  echo "▶ Using nvm to install/use Node ${NODE_VERSION}"
  nvm install "$NODE_VERSION"
  nvm use     "$NODE_VERSION"
else
  echo "▶ nvm not found → installing Node via NodeSource (${NODE_VERSION})"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION%%.*}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
fi

node -v
npm -v

# ── Sync lockfile & install deps ─────────────────────────────────────────
echo "▶ Ensuring package-lock.json matches package.json…"
npm install --package-lock-only

echo "▶ Installing npm dependencies (ci preferred)…"
if ! npm ci; then
  echo "▶ npm ci failed → falling back to npm install"
  npm install
fi

echo "▶ Rebuilding native modules for this architecture…"
npm rebuild

# ── Dev-tooling (ESLint, Jest, TS) ───────────────────────────────────────
echo "▶ Installing/ensuring dev dependencies…"
npm install --save-dev \
  eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  jest ts-jest @types/jest \
  ts-node typescript @types/node

# ── Optional Python deps ─────────────────────────────────────────────────
if [[ -f requirements.txt ]]; then
  echo "▶ Installing Python requirements…"
  python -m pip install --quiet -r requirements.txt
fi

echo "🟢 setup_dev.sh complete. Available commands:"
echo "   npm run lint   # ESLint"
echo "   npm run test   # Jest"
echo "   npm run backtest"
echo "   npm run commitlog"
