#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
ts-node "$DIR/append-memory.ts" "$@"

