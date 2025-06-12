#!/usr/bin/env bash
# Lightweight helper to dump context for Codex tests
# Prints the 5 most recent commits and open tasks from TASKS.md

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

echo "### Recent commits:"
git --no-pager log --oneline -n 5

echo -e "\n### Pending tasks (first 20 lines of TASKS.md):"
if [ -f TASKS.md ]; then
  head -n 20 TASKS.md
else
  echo "No TASKS.md found"
fi
