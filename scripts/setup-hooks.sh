#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
POST_HOOK_PATH="$REPO_ROOT/.git/hooks/post-commit"

install -m 755 "$REPO_ROOT/.husky/post-commit" "$POST_HOOK_PATH"
echo "post-commit hook installed at $POST_HOOK_PATH"

