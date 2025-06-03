#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$DIR/.."
MEM_FILE="$REPO_ROOT/context.snapshot.md"
LOG_DIR="$REPO_ROOT/logs"

on_error() {
  ts=$(date -u +%Y%m%dT%H%M%SZ)
  mkdir -p "$LOG_DIR"
  echo "Memory append failed at $ts" > "$LOG_DIR/memory-error-$ts.txt"
}
trap on_error ERR

last_id=$(tail -n 20 "$MEM_FILE" | grep -o 'mem-[0-9]\+' | tail -n 1 | grep -o '[0-9]\+' || echo '0')
next_id=$(printf "%03d" $((10#$last_id + 1)))

timestamp=$(date -u '+%Y-%m-%d %H:%M UTC')
sha=$(git -C "$REPO_ROOT" rev-parse --short HEAD)

summary=${1:-"No summary provided."}
next_goal=${2:-"TBD."}

TMP=$(mktemp "$MEM_FILE.tmp.XXXX")
cat "$MEM_FILE" > "$TMP"
{
  echo "### $timestamp | mem-$next_id"
  echo "- Commit SHA: $sha"
  echo "- Summary: $summary"
  echo "- Next Goal: $next_goal"
} >> "$TMP"
python3 - "$TMP" <<'EOF'
import os, sys
fd = os.open(sys.argv[1], os.O_RDWR)
os.fsync(fd)
os.close(fd)
EOF
mv "$TMP" "$MEM_FILE"

