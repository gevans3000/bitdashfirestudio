#!/usr/bin/env bash
set -e
for bin in next jest ts-node; do
  if ! npx --no-install $bin --version >/dev/null 2>&1; then
    echo "❌ $bin missing – run 'npm ci'" && exit 1
  fi
done
