#!/usr/bin/env bash
set -e
if [ ! -d node_modules ]; then
  echo "Installing dev dependencies..."
  timeout 20 npm ci --prefer-offline --no-audit --progress=false \
    || echo "npm ci failed – possibly offline"
fi
