#!/usr/bin/env bash
set -e

# ensure Node.js 18
NODE_VERSION=$(node --version 2>/dev/null || echo "")
if [[ $NODE_VERSION != v18* ]]; then
  echo "❌ Node.js 18 required" && exit 1
fi
for bin in next jest ts-node; do
  if ! npx --no-install $bin --version >/dev/null 2>&1; then
    echo "❌ $bin missing – run 'npm ci'" && exit 1
  fi
done
