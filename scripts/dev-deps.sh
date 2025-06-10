#!/usr/bin/env bash
set -euo pipefail

CACHE_DIR=".cache"
CACHE_ARCHIVE="$CACHE_DIR/node_modules.tar.gz"

if [ ! -d node_modules ]; then
  if [ -f "$CACHE_ARCHIVE" ]; then
    echo "Restoring node_modules from cache..."
    tar -xzf "$CACHE_ARCHIVE"
  fi

  echo "Installing dev dependencies..."
  npm ci || echo "npm ci failed – possibly offline"

  if [ -d node_modules ]; then
    echo "Packing node_modules cache..."
    mkdir -p "$CACHE_DIR"
    tar -czf "$CACHE_ARCHIVE" node_modules
  fi
fi
