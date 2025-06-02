#!/usr/bin/env bash
set -e
missing=0
for bin in next jest ts-node; do
  if ! npx --no-install $bin --version >/dev/null 2>&1; then
    echo "⚠️ $bin missing" >&2
    missing=1
  fi
done
if [ $missing -eq 1 ]; then
  echo "Some tools missing; run 'npm run dev-deps'" >&2
fi
