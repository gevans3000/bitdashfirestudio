#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$DIR/.."
SNAPSHOT="$REPO_ROOT/context.snapshot.md"
ARCHIVE_DIR="$REPO_ROOT/archive"
LOG_DIR="$REPO_ROOT/logs"

on_error() {
  ts=$(date -u +%Y%m%dT%H%M%SZ)
  mkdir -p "$LOG_DIR"
  echo "Archive snapshot failed at $ts" > "$LOG_DIR/memory-error-$ts.txt"
}
trap on_error ERR

line_count=$(wc -l < "$SNAPSHOT")
last_date=$(grep '^###' "$SNAPSHOT" | tail -n 1 | awk '{print $2}')
last_month=$(date -d "$last_date" +%Y-%m)
current_month=$(date -u +%Y-%m)

if [ "$line_count" -le 5000 ] && [ "$last_month" = "$current_month" ]; then
  echo "No archive needed."
  exit 0
fi

mkdir -p "$ARCHIVE_DIR"
archive_file="$ARCHIVE_DIR/context_snapshot_${last_month}.md"
last_block_line=$(grep -n '^###' "$SNAPSHOT" | tail -n 1 | cut -d: -f1)
if [ "$last_block_line" -gt 1 ]; then
  head -n $((last_block_line - 1)) "$SNAPSHOT" > "$archive_file"
fi
tail -n $((line_count - last_block_line + 1)) "$SNAPSHOT" > "$SNAPSHOT.tmp"
mv "$SNAPSHOT.tmp" "$SNAPSHOT"

archive_name="$(basename "$archive_file")"
"$DIR/append-memory.sh" "Archived snapshot to $archive_name" "Continue memory logging"
