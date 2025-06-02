#!/usr/bin/env bash
set -e
if [ ! -d node_modules ]; then
  echo "Installing dev dependencies..."
  npm ci || echo "npm ci failed – possibly offline"
fi
