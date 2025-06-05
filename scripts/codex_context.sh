#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

commits=$(git log -n 5 --pretty=format:'- %h %s')

next_task=$(grep -m 1 '^\- \[ \]' TASKS.md | sed -E 's/^\- \[ \] //')

printf "Recent work:\n%s\nNext task: %s\n" "$commits" "$next_task"
